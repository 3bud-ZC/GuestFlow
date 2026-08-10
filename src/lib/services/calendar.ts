import { db } from "@/lib/db";

export const calendarService = {
  async getCalendarData(startDate: Date, endDate: Date, propertyId?: string, roomId?: string) {
    const whereRes: any = {
      checkInDate: { lte: endDate },
      checkOutDate: { gte: startDate },
      status: { not: 'CANCELLED' }
    };
    if (propertyId) whereRes.propertyId = propertyId;
    if (roomId) whereRes.roomId = roomId;

    const whereBlock: any = {
      startDate: { lte: endDate },
      endDate: { gte: startDate }
    };
    if (propertyId) whereBlock.propertyId = propertyId;
    if (roomId) whereBlock.roomId = roomId;

    const [reservations, availabilityBlocks] = await Promise.all([
      db.reservation.findMany({
        where: whereRes,
        select: {
          id: true,
          code: true,
          checkInDate: true,
          checkOutDate: true,
          status: true,
          platform: true,
          guest: { select: { firstName: true, lastName: true } },
          roomId: true
        }
      }),
      db.availabilityBlock.findMany({
        where: whereBlock,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          reason: true,
          roomId: true
        }
      })
    ]);

    return { reservations, availabilityBlocks };
  }
};
