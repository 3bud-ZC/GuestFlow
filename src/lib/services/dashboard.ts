import { db } from "@/lib/db";
import { ReservationStatus, GuestDocumentStatus } from "@prisma/client";

export const dashboardService = {
  async getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const whatsappEnabled = process.env.WHATSAPP_ENABLED === 'true';

    // 1. Parallelize counts and limited fetches
    const [
      checkinsTodayCount,
      checkoutsTodayCount,
      missingIdsCount,
      openTasksCount,
      failedMessagesCount,
      scheduledMessagesCount,
      todaysCheckins,
      todaysCheckouts,
      urgentTasks,
      failedMessages,
      missingIdReservations,
      pendingCheckins,
      pendingCheckouts
    ] = await Promise.all([
      db.reservation.count({ where: { checkInDate: { gte: today, lt: tomorrow } } }),
      db.reservation.count({ where: { checkOutDate: { gte: today, lt: tomorrow } } }),
      db.reservation.count({ where: { checkInDate: { gte: today, lt: tomorrow }, guest: { documentStatus: 'PENDING' } } }),
      db.task.count({ where: { status: { not: 'DONE' } } }),
      whatsappEnabled ? db.message.count({ where: { status: 'FAILED' } }) : Promise.resolve(0),
      whatsappEnabled ? db.message.count({ where: { status: 'SCHEDULED' } }) : Promise.resolve(0),
      
      // Data for rendering lists (top 5)
      db.reservation.findMany({
        where: { checkInDate: { gte: today, lt: tomorrow } },
        include: { guest: { select: { id: true, firstName: true, lastName: true, documentStatus: true } }, room: { select: { name: true } }, property: { select: { name: true } } },
        orderBy: { checkInDate: 'asc' },
        take: 5
      }),
      db.reservation.findMany({
        where: { checkOutDate: { gte: today, lt: tomorrow } },
        include: { guest: { select: { id: true, firstName: true, lastName: true, documentStatus: true } }, room: { select: { name: true } }, property: { select: { name: true } } },
        orderBy: { checkOutDate: 'asc' },
        take: 5
      }),
      
      // Data for Action Required (top 8 max each to cover worst case)
      db.task.findMany({
        where: { status: { not: 'DONE' }, priority: { in: ['URGENT', 'HIGH'] } },
        select: { id: true, priority: true, title: true, reservationId: true },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      whatsappEnabled ? db.message.findMany({
        where: { status: 'FAILED' },
        include: { guest: { select: { firstName: true } } },
        orderBy: { failedTime: 'desc' },
        take: 8
      }) : Promise.resolve([]),
      db.reservation.findMany({
        where: { 
          checkInDate: { gte: today, lt: tomorrow },
          OR: [
            { guest: { documentStatus: 'PENDING' } },
            { guest: null, platform: 'AIRBNB' }
          ]
        },
        include: { guest: { select: { id: true, firstName: true, lastName: true, documentStatus: true } } },
        take: 8
      }),
      db.reservation.findMany({
        where: { checkInDate: { gte: today, lt: tomorrow }, status: 'CONFIRMED' },
        include: { guest: { select: { firstName: true } }, room: { select: { name: true } } },
        take: 8
      }),
      db.reservation.findMany({
        where: { checkOutDate: { gte: today, lt: tomorrow }, status: 'CHECKED_IN' },
        include: { guest: { select: { firstName: true } }, room: { select: { name: true } } },
        take: 8
      })
    ]);

    // Build Action Required List
    const actionRequired: { type: string; message: string; link: string; urgency: string }[] = [];

    missingIdReservations.forEach((res: any) => {
      if (res.guest && res.guest.documentStatus === 'PENDING') {
        const hasTask = urgentTasks.some((t: any) => t.reservationId === res.id);
        if (!hasTask) {
          actionRequired.push({
            type: 'MISSING_ID',
            message: `${res.guest.firstName} ${res.guest.lastName} checking in today is missing ID`,
            link: `/guests/${res.guest.id}`,
            urgency: 'HIGH'
          });
        }
      } else if (!res.guest && res.platform === 'AIRBNB') {
        const hasTask = urgentTasks.some((t: any) => t.reservationId === res.id);
        if (!hasTask) {
          actionRequired.push({
            type: 'MISSING_GUEST',
            message: `Airbnb check-in today (${res.code}) requires guest details`,
            link: `/reservations/${res.id}`,
            urgency: 'HIGH'
          });
        }
      }
    });

    urgentTasks.forEach((task: any) => {
      actionRequired.push({
        type: 'TASK',
        message: `[${task.priority}] ${task.title}`,
        link: `/tasks/${task.id}`,
        urgency: task.priority
      });
    });

    failedMessages.forEach((msg: any) => {
      actionRequired.push({
        type: 'FAILED_MESSAGE',
        message: `WhatsApp delivery failed for ${msg.guest?.firstName || 'Guest'} (${msg.type})`,
        link: `/reservations/${msg.reservationId}`,
        urgency: 'HIGH'
      });
    });

    pendingCheckins.forEach((res: any) => {
      const name = res.guest ? res.guest.firstName : 'Unknown Guest';
      actionRequired.push({
        type: 'CHECK_IN_PENDING',
        message: `${name} check-in pending for ${res.room.name}`,
        link: `/reservations/${res.id}`,
        urgency: 'MEDIUM'
      });
    });

    pendingCheckouts.forEach((res: any) => {
      const name = res.guest ? res.guest.firstName : 'Unknown Guest';
      actionRequired.push({
        type: 'CHECK_OUT_PENDING',
        message: `${name} check-out pending for ${res.room.name}`,
        link: `/reservations/${res.id}`,
        urgency: 'MEDIUM'
      });
    });

    const urgencyWeight: Record<string, number> = { URGENT: 3, HIGH: 2, MEDIUM: 1 };
    actionRequired.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);

    return {
      metrics: {
        checkinsToday: checkinsTodayCount,
        checkoutsToday: checkoutsTodayCount,
        missingIds: missingIdsCount,
        openTasks: openTasksCount,
        failedMessages: failedMessagesCount,
        scheduledMessages: scheduledMessagesCount
      },
      actionRequired: actionRequired.slice(0, 8),
      todaysCheckins,
      todaysCheckouts,
    };
  }
};
