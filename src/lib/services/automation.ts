import { db } from "@/lib/db";
import { MessageType, MessageStatus, GuestDocumentStatus, ReservationStatus } from "@prisma/client";
import { messageService } from "./message";
import { logActivity } from "./activity";

export const automationService = {
  // --- HELPERS ---
  
  async getPropertySettings(propertyId: string) {
    const settings = await db.propertySettings.findUnique({ where: { propertyId } });
    // Default settings if not configured
    if (!settings) {
      return {
        welcomeEnabled: true,
        idReminderEnabled: true,
        locationEnabled: true,
        checkoutReminderEnabled: true,
        reviewRequestEnabled: true,
      };
    }
    return settings;
  },

  async scheduleMessage(
    reservationId: string, 
    guestId: string, 
    type: MessageType, 
    scheduledAt: Date, 
    templateId: string | undefined
  ) {
    // Check if already scheduled, sent, delivered, or read to prevent duplicates
    const existing = await db.message.findFirst({
      where: {
        reservationId,
        type,
        status: { in: [MessageStatus.SCHEDULED, MessageStatus.SENDING, MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ] }
      }
    });

    if (existing) return null; // Prevent duplicate

    const message = await db.message.create({
      data: {
        type,
        status: MessageStatus.SCHEDULED,
        scheduledAt,
        reservationId,
        guestId,
        templateId
      }
    });

    await logActivity({
      reservationId,
      action: `AUTOMATION_SCHEDULED_${type}`,
      metadata: { scheduledAt }
    });

    return message;
  },

  async cancelScheduledMessage(reservationId: string, type: MessageType, reason: string) {
    const scheduled = await db.message.findMany({
      where: {
        reservationId,
        type,
        status: MessageStatus.SCHEDULED
      }
    });

    for (const msg of scheduled) {
      await db.message.update({
        where: { id: msg.id },
        data: { status: MessageStatus.CANCELLED }
      });
      
      await logActivity({
        reservationId,
        action: `AUTOMATION_CANCELLED_${type}`,
        metadata: { reason }
      });
    }
  },

  async cancelAllScheduled(reservationId: string, reason: string) {
    const scheduled = await db.message.findMany({
      where: {
        reservationId,
        status: MessageStatus.SCHEDULED
      }
    });

    for (const msg of scheduled) {
      await db.message.update({
        where: { id: msg.id },
        data: { status: MessageStatus.CANCELLED }
      });
    }

    if (scheduled.length > 0) {
      await logActivity({
        reservationId,
        action: `AUTOMATION_CANCELLED_ALL`,
        metadata: { reason, count: scheduled.length }
      });
    }
  },

  // --- EVENTS ---

  async onReservationCreated(reservationId: string) {
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: { guest: true, property: true }
    });

    if (!reservation || !reservation.guest) return;

    const settings = await this.getPropertySettings(reservation.propertyId);
    
    // 1. WELCOME
    if (settings.welcomeEnabled) {
      const welcomeTemplate = await messageService.getTemplateByType(MessageType.WELCOME);
      if (welcomeTemplate) {
        if (!reservation.guest.phone) {
          // Missing phone, create task
          await db.task.create({
            data: {
              title: "Get guest phone number",
              description: `Guest ${reservation.guest.firstName} is missing a phone number for Welcome message.`,
              priority: "HIGH",
              reservationId: reservation.id,
              guestId: reservation.guest.id
            }
          });
        } else {
          // Schedule immediately
          await this.scheduleMessage(reservation.id, reservation.guest.id, MessageType.WELCOME, new Date(), welcomeTemplate.id);
        }
      }
    }

    // 2. LOCATION (24h before check-in)
    if (settings.locationEnabled) {
      const locationTemplate = await messageService.getTemplateByType(MessageType.LOCATION);
      if (locationTemplate) {
        const scheduledTime = new Date(reservation.checkInDate);
        scheduledTime.setHours(scheduledTime.getHours() - 24);
        await this.scheduleMessage(reservation.id, reservation.guest.id, MessageType.LOCATION, scheduledTime, locationTemplate.id);
      }
    }

    // 3. ID_REMINDER (24h before check-in if pending)
    if (settings.idReminderEnabled && reservation.guest.documentStatus === GuestDocumentStatus.PENDING) {
      const idTemplate = await messageService.getTemplateByType(MessageType.ID_REMINDER);
      if (idTemplate) {
        const scheduledTime = new Date(reservation.checkInDate);
        scheduledTime.setHours(scheduledTime.getHours() - 24);
        await this.scheduleMessage(reservation.id, reservation.guest.id, MessageType.ID_REMINDER, scheduledTime, idTemplate.id);
      }
    }

    // 4. CHECKOUT_REMINDER (24h before check-out)
    if (settings.checkoutReminderEnabled) {
      const checkoutTemplate = await messageService.getTemplateByType(MessageType.CHECKOUT_REMINDER);
      if (checkoutTemplate) {
        const scheduledTime = new Date(reservation.checkOutDate);
        scheduledTime.setHours(scheduledTime.getHours() - 24);
        await this.scheduleMessage(reservation.id, reservation.guest.id, MessageType.CHECKOUT_REMINDER, scheduledTime, checkoutTemplate.id);
      }
    }
  },

  async onGuestIdReceived(guestId: string) {
    const reservations = await db.reservation.findMany({
      where: {
        guestId,
        status: { in: [ReservationStatus.CONFIRMED] }
      }
    });

    for (const res of reservations) {
      await this.cancelScheduledMessage(res.id, MessageType.ID_REMINDER, "Guest ID received");
    }
  },

  async onCheckIn(reservationId: string) {
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: { guest: true }
    });
    if (!reservation || !reservation.guest) return;

    // Cancel pending pre-arrival messages
    await this.cancelScheduledMessage(reservation.id, MessageType.LOCATION, "Guest checked in");
    await this.cancelScheduledMessage(reservation.id, MessageType.ID_REMINDER, "Guest checked in");

    // Schedule Check-in Welcome immediately
    const settings = await this.getPropertySettings(reservation.propertyId);
    if (settings.welcomeEnabled) { // using welcomeEnabled as generic, ideally we have checkinWelcomeEnabled but the prompt didn't strictly require it
      const checkinTemplate = await messageService.getTemplateByType(MessageType.CHECKIN_WELCOME);
      if (checkinTemplate) {
        await this.scheduleMessage(reservation.id, reservation.guest.id, MessageType.CHECKIN_WELCOME, new Date(), checkinTemplate.id);
      }
    }
  },

  async onCheckOut(reservationId: string) {
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: { guest: true }
    });
    if (!reservation || !reservation.guest) return;

    // Cancel pending checkout reminders
    await this.cancelScheduledMessage(reservation.id, MessageType.CHECKOUT_REMINDER, "Guest checked out");

    // Schedule Review Request
    const settings = await this.getPropertySettings(reservation.propertyId);
    if (settings.reviewRequestEnabled) {
      const reviewTemplate = await messageService.getTemplateByType(MessageType.REVIEW_REQUEST);
      if (reviewTemplate) {
        // Schedule immediately or slightly after, MVP is immediate
        await this.scheduleMessage(reservation.id, reservation.guest.id, MessageType.REVIEW_REQUEST, new Date(), reviewTemplate.id);
      }
    }
  },

  async onCancel(reservationId: string) {
    await this.cancelAllScheduled(reservationId, "Reservation cancelled");
  }
};
