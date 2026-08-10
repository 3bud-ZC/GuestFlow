import { db } from "@/lib/db";
import { ReservationStatus, GuestDocumentStatus } from "@prisma/client";

export const dashboardService = {
  async getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todaysCheckins,
      todaysCheckouts,
      missingIdsCheckins,
      openTasks,
      failedMessages,
      scheduledMessages
    ] = await Promise.all([
      // Check-ins today
      db.reservation.findMany({
        where: { checkInDate: { gte: today, lt: tomorrow } },
        include: { guest: true, property: true, room: true }
      }),
      // Check-outs today
      db.reservation.findMany({
        where: { checkOutDate: { gte: today, lt: tomorrow } },
        include: { guest: true, property: true, room: true }
      }),
      // Missing IDs for pending check-ins
      db.reservation.findMany({
        where: { checkInDate: { gte: today, lt: tomorrow }, guest: { documentStatus: 'PENDING' } },
        include: { guest: true }
      }),
      // Open tasks
      db.task.findMany({
        where: { status: { not: 'DONE' } },
        include: { guest: true, reservation: true }
      }),
      // Failed messages
      db.message.findMany({
        where: { status: 'FAILED' },
        include: { guest: true, reservation: true }
      }),
      // Scheduled messages
      db.message.count({
        where: { status: 'SCHEDULED' }
      })
    ]);

    // Build Action Required List
    const actionRequired: { type: string; message: string; link: string; urgency: string }[] = [];

    // 1. Missing IDs for check-ins today
    todaysCheckins.forEach(res => {
      if (res.guest.documentStatus === 'PENDING') {
        // Deduplicate: avoid if a task already exists for this reservation regarding missing ID/phone
        const hasTask = openTasks.some(t => t.reservationId === res.id);
        if (!hasTask) {
          actionRequired.push({
            type: 'MISSING_ID',
            message: `${res.guest.firstName} ${res.guest.lastName} checking in today is missing ID`,
            link: `/guests/${res.guest.id}`,
            urgency: 'HIGH'
          });
        }
      }
    });

    // 2. High/Urgent Open Tasks
    openTasks.forEach(task => {
      if (task.priority === 'URGENT' || task.priority === 'HIGH') {
        actionRequired.push({
          type: 'TASK',
          message: `[${task.priority}] ${task.title}`,
          link: `/tasks/${task.id}`,
          urgency: task.priority
        });
      }
    });

    // 3. Failed Messages
    failedMessages.forEach(msg => {
      actionRequired.push({
        type: 'FAILED_MESSAGE',
        message: `WhatsApp delivery failed for ${msg.guest.firstName} (${msg.type})`,
        link: `/reservations/${msg.reservationId}`,
        urgency: 'HIGH'
      });
    });

    // 4. Pending Check-ins (after 2 PM or generic)
    todaysCheckins.forEach(res => {
      if (res.status === 'CONFIRMED') {
        actionRequired.push({
          type: 'CHECK_IN_PENDING',
          message: `${res.guest.firstName} check-in pending for ${res.room.name}`,
          link: `/reservations/${res.id}`,
          urgency: 'MEDIUM'
        });
      }
    });

    // 5. Pending Check-outs
    todaysCheckouts.forEach(res => {
      if (res.status === 'CHECKED_IN') {
        actionRequired.push({
          type: 'CHECK_OUT_PENDING',
          message: `${res.guest.firstName} check-out pending for ${res.room.name}`,
          link: `/reservations/${res.id}`,
          urgency: 'MEDIUM'
        });
      }
    });

    // Sort by Urgency: URGENT > HIGH > MEDIUM
    const urgencyWeight: Record<string, number> = { URGENT: 3, HIGH: 2, MEDIUM: 1 };
    actionRequired.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);

    return {
      metrics: {
        checkinsToday: todaysCheckins.length,
        checkoutsToday: todaysCheckouts.length,
        missingIds: missingIdsCheckins.length,
        openTasks: openTasks.length,
        failedMessages: failedMessages.length,
        scheduledMessages
      },
      actionRequired,
      todaysCheckins,
      todaysCheckouts,
    };
  }
};
