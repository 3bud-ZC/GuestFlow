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
    return db.room.create({ data: validData });
  },

  async updateRoom(id: string, data: RoomInput) {
    const validData = RoomSchema.parse(data);
    return db.room.update({
      where: { id },
      data: validData,
    });
  },
};
