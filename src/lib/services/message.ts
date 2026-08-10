import { db } from "@/lib/db";
import { MessageType, MessageStatus, GuestDocumentStatus } from "@prisma/client";
import { whatsappService } from "./whatsapp";
import { logActivity } from "./activity";
import { MessageTemplateInput, MessageTemplateSchema } from "../validation/message";

export const messageService = {
  // --- TEMPLATES ---
  async getTemplates() {
    return db.messageTemplate.findMany({ orderBy: { type: 'asc' } });
  },

  async getTemplateByType(type: MessageType) {
    return db.messageTemplate.findFirst({ where: { type, enabled: true } });
  },

  async upsertTemplate(data: MessageTemplateInput) {
    const validData = MessageTemplateSchema.parse(data);
    const existing = await db.messageTemplate.findFirst({ where: { type: validData.type } });
    if (existing) {
      return db.messageTemplate.update({ where: { id: existing.id }, data: validData });
    }
    return db.messageTemplate.create({ data: validData });
  },

  // --- MESSAGES LOG ---
  async getReservationMessages(reservationId: string) {
    return db.message.findMany({
      where: { reservationId },
      include: { template: true },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getAllMessages(filters?: { status?: string; type?: string }) {
    const where: any = {};
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.type && filters.type !== "ALL") where.type = filters.type;

    return db.message.findMany({
      where,
      include: { guest: true, reservation: true, template: true },
      orderBy: { createdAt: 'desc' }
    });
  },

  // --- VARIABLES RESOLUTION ---
  resolveVariables(type: MessageType, reservation: any): any[] {
    // Basic resolution to match Meta template components
    // A production implementation would dynamically map these based on template metadata, 
    // but for MVP we return an array of body parameters based on expected GuestFlow template types.
    const guestName = reservation.guest.firstName;
    const propertyName = reservation.property.name;
    const address = reservation.property.address || "Property Address";

    switch (type) {
      case MessageType.WELCOME:
        return [
          { type: "text", text: guestName },
          { type: "text", text: propertyName }
        ];
      case MessageType.ID_REMINDER:
        return [
          { type: "text", text: guestName }
        ];
      case MessageType.LOCATION:
        return [
          { type: "text", text: guestName },
          { type: "text", text: propertyName },
          { type: "text", text: address }
        ];
      case MessageType.CHECKIN_WELCOME:
        return [
          { type: "text", text: guestName }
        ];
      case MessageType.CHECKOUT_REMINDER:
        return [
          { type: "text", text: guestName }
        ];
      case MessageType.REVIEW_REQUEST:
        return [
          { type: "text", text: guestName }
        ];
      default:
        return [];
    }
  },

  // --- SEND MANUAL MESSAGE ---
  async sendManualMessage(reservationId: string, templateType: MessageType, actorEmail?: string) {
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: { guest: true, property: true, room: true }
    });

    if (!reservation) throw new Error("Reservation not found");
    if (!reservation.guest.phone) throw new Error("Guest does not have a phone number");

    const phone = whatsappService.normalizePhone(reservation.guest.phone);
    if (!phone) throw new Error("Guest phone number is invalid for WhatsApp");

    const template = await this.getTemplateByType(templateType);
    if (!template) throw new Error(`Template for ${templateType} is not configured or disabled`);

    // Create message record as SENDING
    let message = await db.message.create({
      data: {
        type: templateType,
        status: MessageStatus.SENDING,
        reservationId: reservation.id,
        guestId: reservation.guest.id,
        templateId: template.id
      }
    });

    const parameters = this.resolveVariables(templateType, reservation);
    const whatsappPayload = {
      name: template.metaTemplateName,
      language: { code: template.languageCode },
      components: parameters.length > 0 ? [
        {
          type: "body",
          parameters: parameters
        }
      ] : []
    };

    const result = await whatsappService.sendTemplateMessage(phone, whatsappPayload);

    if (result.success) {
      message = await db.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.SENT,
          sentTime: new Date(),
          providerMessageId: result.providerMessageId
        }
      });
      await logActivity({
        reservationId: reservation.id,
        action: `MESSAGE_SENT_${templateType}`,
        metadata: { sentBy: actorEmail, providerId: result.providerMessageId }
      });
    } else {
      message = await db.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.FAILED,
          failedTime: new Date(),
          errorInfo: result.error
        }
      });
      await logActivity({
        reservationId: reservation.id,
        action: `MESSAGE_FAILED_${templateType}`,
        metadata: { error: result.error, sentBy: actorEmail }
      });
    }

    return message;
  },

  // --- WEBHOOK HANDLING ---
  async handleWebhookStatusUpdate(providerMessageId: string, statusText: string) {
    const message = await db.message.findFirst({ where: { providerMessageId } });
    if (!message) return; // We don't track this message or it was deleted

    let newStatus: MessageStatus | null = null;
    let updateData: any = {};

    switch (statusText) {
      case "sent": newStatus = MessageStatus.SENT; break;
      case "delivered": newStatus = MessageStatus.DELIVERED; break;
      case "read": newStatus = MessageStatus.READ; break;
      case "failed": newStatus = MessageStatus.FAILED; updateData.failedTime = new Date(); break;
    }

    if (!newStatus) return;

    // Prevent backwards regression (e.g. READ -> SENT)
    const statusOrder: MessageStatus[] = [
      MessageStatus.SCHEDULED,
      MessageStatus.SENDING,
      MessageStatus.SENT,
      MessageStatus.DELIVERED,
      MessageStatus.READ
    ];

    const currentIndex = statusOrder.indexOf(message.status);
    const newIndex = statusOrder.indexOf(newStatus);

    if (newStatus !== MessageStatus.FAILED) {
      if (currentIndex > -1 && newIndex > -1 && newIndex <= currentIndex) {
        // Status is regressing, ignore
        return;
      }
    }

    updateData.status = newStatus;

    await db.message.update({
      where: { id: message.id },
      data: updateData
    });

    if (newStatus === MessageStatus.FAILED && message.status !== MessageStatus.FAILED) {
      // Optional: Auto-create task if webhooks report failure later
      await db.task.create({
        data: {
          title: "Contact guest manually",
          description: `WhatsApp message (${message.type}) failed to deliver.`,
          priority: "HIGH",
          reservationId: message.reservationId,
          guestId: message.guestId
        }
      });
    }
  }
};
