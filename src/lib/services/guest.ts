import { db } from "@/lib/db";
import { GuestInput, GuestSchema } from "../validation/guest";

export const guestService = {
  async getGuests(filters?: { query?: string; page?: number; pageSize?: number }) {
    const where = filters?.query
      ? {
          OR: [
            { firstName: { contains: filters?.query, mode: "insensitive" as const } },
            { lastName: { contains: filters?.query, mode: "insensitive" as const } },
            { email: { contains: filters?.query, mode: "insensitive" as const } },
            { phone: { contains: filters?.query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      db.guest.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true, documentStatus: true,
          _count: { select: { reservations: true } },
          reservations: {
            orderBy: { checkInDate: "desc" },
            take: 1,
            select: { checkInDate: true, checkOutDate: true, status: true }
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: pageSize,
      }),
      db.guest.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
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
