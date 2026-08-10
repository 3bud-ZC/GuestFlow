import { db } from "@/lib/db";
import { MessageStatus } from "@prisma/client";
import { whatsappService } from "./whatsapp";
import { messageService } from "./message";
import { logActivity } from "./activity";

export const automationProcessor = {
  async processDueAutomations() {
    console.log("Starting automation processor...");
    
    // Query SCHEDULED messages where scheduledAt <= now
    const now = new Date();
    const dueMessages = await db.message.findMany({
      where: {
        status: MessageStatus.SCHEDULED,
        scheduledAt: { lte: now }
      },
      include: {
        reservation: {
          include: { guest: true, property: true, room: true }
        },
        guest: true,
        template: true
      }
    });

    console.log(`Found ${dueMessages.length} due messages.`);

    const results = {
      processed: dueMessages.length,
      sent: 0,
      failed: 0,
      skipped: 0
    };

    for (const msg of dueMessages) {
      if (!msg.template) {
        results.skipped++;
        continue;
      }

      // Check if reservation is still eligible (e.g. not cancelled)
      if (msg.reservation.status === 'CANCELLED') {
        await db.message.update({ where: { id: msg.id }, data: { status: MessageStatus.CANCELLED } });
        results.skipped++;
        continue;
      }

      // Change state to SENDING
      await db.message.update({
        where: { id: msg.id },
        data: { status: MessageStatus.SENDING }
      });

      // Verify phone
      if (!msg.guest.phone) {
        await db.message.update({
          where: { id: msg.id },
          data: { 
            status: MessageStatus.FAILED, 
            failedTime: new Date(), 
            errorInfo: "Missing guest phone number" 
          }
        });
        results.failed++;
        continue;
      }

      const phone = whatsappService.normalizePhone(msg.guest.phone);
      if (!phone) {
        await db.message.update({
          where: { id: msg.id },
          data: { 
            status: MessageStatus.FAILED, 
            failedTime: new Date(), 
            errorInfo: "Invalid phone number format" 
          }
        });
        results.failed++;
        continue;
      }

      // Resolve variables
      const parameters = messageService.resolveVariables(msg.type, msg.reservation);
      const whatsappPayload = {
        name: msg.template.metaTemplateName,
        language: { code: msg.template.languageCode },
        components: parameters.length > 0 ? [
          {
            type: "body",
            parameters: parameters
          }
        ] : []
      };

      // Call WhatsApp service
      const result = await whatsappService.sendTemplateMessage(phone, whatsappPayload);

      if (result.success) {
        await db.message.update({
          where: { id: msg.id },
          data: {
            status: MessageStatus.SENT,
            sentTime: new Date(),
            providerMessageId: result.providerMessageId
          }
        });
        
        await logActivity({
          reservationId: msg.reservationId,
          action: `AUTOMATION_SENT_${msg.type}`,
          metadata: { providerId: result.providerMessageId }
        });
        
        results.sent++;
      } else {
        await db.message.update({
          where: { id: msg.id },
          data: {
            status: MessageStatus.FAILED,
            failedTime: new Date(),
            errorInfo: result.error
          }
        });

        await logActivity({
          reservationId: msg.reservationId,
          action: `AUTOMATION_FAILED_${msg.type}`,
          metadata: { error: result.error }
        });

        // Create Task on failure
        await db.task.create({
          data: {
            title: "Contact guest manually",
            description: `Automated WhatsApp message (${msg.type}) failed: ${result.error}`,
            priority: "HIGH",
            reservationId: msg.reservationId,
            guestId: msg.guestId
          }
        });

        results.failed++;
      }
    }

    return results;
  }
};
