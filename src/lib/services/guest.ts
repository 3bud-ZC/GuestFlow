import { db } from "@/lib/db";
import { GuestInput, GuestSchema } from "../validation/guest";

export const guestService = {
  async getGuests(query?: string) {
    const where = query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" as const } },
            { lastName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    return db.guest.findMany({
      where,
      include: {
        _count: {
          select: { reservations: true },
        },
        reservations: {
          orderBy: { checkInDate: "desc" },
          take: 1,
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  },

  async getGuestById(id: string) {
    return db.guest.findUnique({
      where: { id },
      include: {
        reservations: {
          include: {
            property: true,
            room: true,
          },
          orderBy: { checkInDate: "desc" },
        },
      },
    });
  },

  async createGuest(data: GuestInput) {
    const validData = GuestSchema.parse(data);
    return db.guest.create({ data: validData });
  },

  async updateGuest(id: string, data: GuestInput) {
    const validData = GuestSchema.parse(data);
    return db.guest.update({
      where: { id },
      data: validData,
    });
  },
};
