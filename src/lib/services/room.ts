import { db } from "@/lib/db";
import { RoomInput, RoomSchema } from "../validation/room";

export const roomService = {
  async getRoomsByProperty(propertyId: string) {
    return db.room.findMany({
      where: { propertyId },
      orderBy: { name: "asc" },
    });
  },
  
  async getAllRooms() {
    return db.room.findMany({
      include: { property: true },
      orderBy: [
        { property: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  },

  async createRoom(data: RoomInput) {
    const validData = RoomSchema.parse(data);

    if (validData.airbnbIcalUrl) {
      const { airbnbService, AirbnbError } = await import('./airbnb');
      if (!airbnbService.validateUrl(validData.airbnbIcalUrl)) {
        throw new AirbnbError('AIRBNB_URL_INVALID', 'Invalid Airbnb calendar URL.', {
          en: 'The Airbnb calendar link format is not valid. Please copy the link directly from Airbnb › Calendar › Export Calendar.',
          ar: 'تنسيق رابط تقويم Airbnb غير صحيح. يرجى نسخ الرابط مباشرةً من Airbnb › التقويم › تصدير التقويم.',
        });
      }

      const probeResult = await airbnbService.probe(validData.airbnbIcalUrl);
      if (!probeResult.healthy) {
        throw new AirbnbError(
          probeResult.errorCode ?? 'AIRBNB_FETCH_TIMEOUT',
          probeResult.error ?? 'Failed to connect to Airbnb calendar.',
          { en: probeResult.error ?? 'Failed to connect to Airbnb calendar.', ar: probeResult.errorAr ?? 'فشل الاتصال بتقويم Airbnb.' }
        );
      }

      validData.airbnbListingId = probeResult.listingId || undefined;
      validData.airbnbCalendarName = probeResult.calendarName || undefined;

      const existing = await db.room.findFirst({
        where: { airbnbIcalUrl: validData.airbnbIcalUrl }
      });
      if (existing) {
        throw new AirbnbError('AIRBNB_DUPLICATE_LISTING', 'This Airbnb URL is already connected to another room.', {
          en: 'This Airbnb calendar link is already connected to another room.',
          ar: 'رابط تقويم Airbnb هذا متصل بالفعل بغرفة أخرى.',
        });
      }

      if (validData.airbnbListingId) {
        const existingListing = await db.room.findFirst({
          where: { airbnbListingId: validData.airbnbListingId, airbnbIcalUrl: { not: null } }
        });
        if (existingListing) {
          throw new AirbnbError('AIRBNB_DUPLICATE_LISTING', 'This Airbnb listing ID is already actively connected to another room.', {
            en: 'This Airbnb listing is already actively connected to another room.',
            ar: 'هذه الوحدة على Airbnb متصلة بالفعل بغرفة أخرى.',
          });
        }
      }
    }
    
    const room = await db.room.create({ data: validData });

    if (validData.airbnbIcalUrl) {
      const { syncService } = await import('./sync');
      try {
        await syncService.syncRoom(room.id);
      } catch (e: any) {
        await db.room.update({
          where: { id: room.id },
          data: { airbnbLastSyncError: e.message || "Initial sync failed" }
        });
      }
    }
    
    return room;
  },

  async updateRoom(id: string, data: RoomInput) {
    const validData = RoomSchema.parse(data);
    
    if (validData.airbnbIcalUrl) {
      const { airbnbService, AirbnbError } = await import('./airbnb');
      if (!airbnbService.validateUrl(validData.airbnbIcalUrl)) {
        throw new AirbnbError('AIRBNB_URL_INVALID', 'Invalid Airbnb calendar URL.', {
          en: 'The Airbnb calendar link format is not valid. Please copy the link directly from Airbnb › Calendar › Export Calendar.',
          ar: 'تنسيق رابط تقويم Airbnb غير صحيح. يرجى نسخ الرابط مباشرةً من Airbnb › التقويم › تصدير التقويم.',
        });
      }
    }

    return db.room.update({
      where: { id },
      data: validData,
    });
  },

  async syncAirbnbConnection(id: string) {
    const room = await db.room.findUnique({ where: { id } });
    if (!room || !room.airbnbIcalUrl || !room.airbnbSyncEnabled) {
      throw new Error("Room does not have an active Airbnb connection.");
    }

    const { syncService } = await import('./sync');
    return await syncService.syncRoom(id);
  },

  async disconnectAirbnbConnection(id: string) {
    return db.room.update({
      where: { id },
      data: {
        airbnbIcalUrl: null,
        airbnbListingId: null,
        airbnbCalendarName: null,
        airbnbSyncEnabled: false,
        airbnbLastSyncedAt: null,
        airbnbLastSyncError: null,
      }
    });
  },

  async connectAirbnbConnection(roomId: string, airbnbIcalUrl: string) {
    const { airbnbService, AirbnbError } = await import('./airbnb');
    if (!airbnbService.validateUrl(airbnbIcalUrl)) {
      throw new AirbnbError('AIRBNB_URL_INVALID', 'Invalid Airbnb calendar URL.', {
        en: 'The Airbnb calendar link format is not valid. Please copy the link directly from Airbnb › Calendar › Export Calendar.',
        ar: 'تنسيق رابط تقويم Airbnb غير صحيح. يرجى نسخ الرابط مباشرةً من Airbnb › التقويم › تصدير التقويم.',
      });
    }

    const probeResult = await airbnbService.probe(airbnbIcalUrl);
    if (!probeResult.healthy) {
      throw new AirbnbError(
        probeResult.errorCode ?? 'AIRBNB_FETCH_TIMEOUT',
        probeResult.error ?? 'Failed to connect to Airbnb calendar.',
        { en: probeResult.error ?? 'Failed to connect to Airbnb calendar.', ar: probeResult.errorAr ?? 'فشل الاتصال بتقويم Airbnb.' }
      );
    }

    const airbnbListingId = probeResult.listingId || null;
    const airbnbCalendarName = probeResult.calendarName || null;

    const existingUrl = await db.room.findFirst({
      where: { airbnbIcalUrl }
    });
    if (existingUrl && existingUrl.id !== roomId) {
      throw new AirbnbError('AIRBNB_DUPLICATE_LISTING', 'This Airbnb URL is already connected to another room.', {
        en: 'This Airbnb calendar link is already connected to another room.',
        ar: 'رابط تقويم Airbnb هذا متصل بالفعل بغرفة أخرى.',
      });
    }

    if (airbnbListingId) {
      const existingListing = await db.room.findFirst({
        where: { airbnbListingId, airbnbIcalUrl: { not: null } }
      });
      if (existingListing && existingListing.id !== roomId) {
        throw new AirbnbError('AIRBNB_DUPLICATE_LISTING', 'This Airbnb listing ID is already actively connected to another room.', {
          en: 'This Airbnb listing is already actively connected to another room.',
          ar: 'هذه الوحدة على Airbnb متصلة بالفعل بغرفة أخرى.',
        });
      }
    }

    await db.room.update({
      where: { id: roomId },
      data: {
        airbnbIcalUrl,
        airbnbListingId,
        airbnbCalendarName,
        airbnbSyncEnabled: true,
        airbnbLastSyncError: null,
      }
    });

    const { syncService } = await import('./sync');
    try {
      return await syncService.syncRoom(roomId);
    } catch (e: any) {
      await db.room.update({
        where: { id: roomId },
        data: { airbnbLastSyncError: e.message || "Initial sync failed" }
      });
      return { success: false, error: e.message || "Initial sync failed" };
    }
  }
};
