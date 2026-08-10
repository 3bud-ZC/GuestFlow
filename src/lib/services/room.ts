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
      const { airbnbService } = await import('./airbnb');
      if (!airbnbService.validateUrl(validData.airbnbIcalUrl)) {
        throw new Error("Invalid Airbnb calendar URL.");
      }

      const existing = await db.room.findUnique({
        where: { airbnbIcalUrl: validData.airbnbIcalUrl }
      });
      if (existing) {
        throw new Error("This Airbnb listing is already connected to another room.");
      }
    }
    
    return db.room.create({ data: validData });
  },

  async updateRoom(id: string, data: RoomInput) {
    const validData = RoomSchema.parse(data);
    
    if (validData.airbnbIcalUrl) {
      const { airbnbService } = await import('./airbnb');
      if (!airbnbService.validateUrl(validData.airbnbIcalUrl)) {
        throw new Error("Invalid Airbnb calendar URL.");
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
  }
};
