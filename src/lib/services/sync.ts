import { db } from "@/lib/db";
import { airbnbService } from "./airbnb";
import ical from 'node-ical';
import { ReservationPlatform, ReservationStatus, TaskPriority, TaskStatus } from "@prisma/client";

export const syncService = {
  async syncRoom(roomId: string) {
    const room = await db.room.findUnique({ where: { id: roomId }, include: { property: true } });
    if (!room || !room.airbnbIcalUrl || !room.airbnbSyncEnabled) {
      return { success: false, error: "Room not configured for Airbnb sync" };
    }

    try {
      const icalData = await airbnbService.fetchCalendar(room.airbnbIcalUrl);
      const events = await ical.async.parseICS(icalData);

      const parsedEventIds = new Set<string>();
      let importedReservations = 0;
      let importedBlocks = 0;
      let conflicts = 0;
      let unchanged = 0;
      let updated = 0;

      for (const k in events) {
        const ev: any = events[k];
        if (ev.type !== 'VEVENT') continue;

        const uid = ev.uid;
        if (!uid) continue;
        parsedEventIds.add(uid);

        const summary = ev.summary || '';
        const isBlock = summary.toLowerCase().includes('not available') || summary.toLowerCase().includes('blocked');
        
        const startDate = ev.start;
        const endDate = ev.end;
        if (!startDate || !endDate) continue;

        // Conflict check against DIRECT/BOOKING reservations
        const overlappingManual = await db.reservation.findFirst({
          where: {
            roomId: room.id,
            status: { not: 'CANCELLED' },
            externalSource: null, // manual reservations
            AND: [
              { checkInDate: { lt: endDate } },
              { checkOutDate: { gt: startDate } }
            ]
          }
        });

        if (overlappingManual) {
          conflicts++;
          // Create task for conflict if one doesn't exist
          const existingTask = await db.task.findFirst({
            where: {
              title: "Calendar Conflict",
              reservationId: overlappingManual.id,
              status: 'OPEN'
            }
          });
          if (!existingTask) {
            await db.task.create({
              data: {
                title: "Calendar Conflict",
                description: `Airbnb sync found an overlapping event for Room ${room.name} from ${startDate.toDateString()} to ${endDate.toDateString()}.`,
                priority: TaskPriority.HIGH,
                reservationId: overlappingManual.id,
              }
            });
          }
        }

        if (isBlock) {
          const existingBlock = await db.availabilityBlock.findUnique({ where: { roomId_externalEventId: { roomId: room.id, externalEventId: uid } } });
          if (existingBlock) {
            if (existingBlock.startDate.getTime() !== startDate.getTime() || existingBlock.endDate.getTime() !== endDate.getTime()) {
              await db.availabilityBlock.update({
                where: { roomId_externalEventId: { roomId: room.id, externalEventId: uid } },
                data: { startDate, endDate, reason: summary }
              });
              updated++;
            } else {
              unchanged++;
            }
          } else {
            await db.availabilityBlock.create({
              data: {
                propertyId: room.propertyId,
                roomId: room.id,
                startDate,
                endDate,
                externalSource: 'AIRBNB',
                externalEventId: uid,
                reason: summary,
              }
            });
            importedBlocks++;
          }
        } else {
          const existingRes = await db.reservation.findUnique({ where: { roomId_externalEventId: { roomId: room.id, externalEventId: uid } } });
          if (existingRes) {
            if (existingRes.checkInDate.getTime() !== startDate.getTime() || existingRes.checkOutDate.getTime() !== endDate.getTime()) {
              await db.reservation.update({
                where: { roomId_externalEventId: { roomId: room.id, externalEventId: uid } },
                data: { checkInDate: startDate, checkOutDate: endDate }
              });
              updated++;
            } else {
              unchanged++;
            }
          } else {
            const crypto = require('crypto');
            const stableHash = crypto.createHash('sha256').update(room.id + uid).digest('hex').substring(0, 8).toUpperCase();
            // New imported reservation without guest identity
            await db.reservation.create({
              data: {
                code: `AB-${stableHash}`,
                platform: ReservationPlatform.AIRBNB,
                propertyId: room.propertyId,
                roomId: room.id,
                checkInDate: startDate,
                checkOutDate: endDate,
                numberOfGuests: 1,
                status: ReservationStatus.CONFIRMED,
                externalSource: 'AIRBNB',
                externalEventId: uid,
                // guestId is null, indicating details are required
              }
            });
            importedReservations++;
          }
        }
      }

      // Reconciliation: Remove stale events
      const existingBlocks = await db.availabilityBlock.findMany({ where: { roomId: room.id, externalSource: 'AIRBNB' } });
      let removedBlocks = 0;
      for (const b of existingBlocks) {
        if (b.externalEventId && !parsedEventIds.has(b.externalEventId)) {
          await db.availabilityBlock.delete({ where: { id: b.id } });
          removedBlocks++;
        }
      }

      const existingReservations = await db.reservation.findMany({ where: { roomId: room.id, externalSource: 'AIRBNB', status: { not: 'CANCELLED' } } });
      let cancelledReservations = 0;
      for (const r of existingReservations) {
        if (r.externalEventId && !parsedEventIds.has(r.externalEventId)) {
          await db.reservation.update({ where: { id: r.id }, data: { status: 'CANCELLED' } });
          cancelledReservations++;
        }
      }

      // Update sync health
      await db.room.update({
        where: { id: room.id },
        data: { airbnbLastSyncedAt: new Date(), airbnbLastSyncError: null }
      });

      return {
        success: true,
        summary: {
          importedReservations,
          updated,
          cancelledReservations,
          importedBlocks,
          removedBlocks,
          conflicts,
          unchanged
        }
      };
    } catch (e: any) {
      await db.room.update({
        where: { id: room.id },
        data: { airbnbLastSyncedAt: new Date(), airbnbLastSyncError: e.message }
      });
      return { success: false, error: e.message };
    }
  }
};
