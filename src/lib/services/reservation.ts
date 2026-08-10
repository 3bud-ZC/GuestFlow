import { db } from "@/lib/db";
import { ReservationInput, ReservationSchema } from "../validation/reservation";
import { GuestInput, GuestSchema } from "../validation/guest";

export const reservationService = {
  async getReservations(filters?: {
    query?: string;
    platform?: string;
    status?: string;
    idStatus?: string;
    dateFilter?: string;
  }) {
    let where: any = {};

    if (filters?.query) {
      where.OR = [
        { code: { contains: filters.query, mode: "insensitive" } },
        { guest: { firstName: { contains: filters.query, mode: "insensitive" } } },
        { guest: { lastName: { contains: filters.query, mode: "insensitive" } } },
        { guest: { phone: { contains: filters.query, mode: "insensitive" } } },
      ];
    }

    if (filters?.platform && filters.platform !== "ALL") {
      where.platform = filters.platform;
    }

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.idStatus && filters.idStatus !== "ALL") {
      where.guest = { ...where.guest, documentStatus: filters.idStatus };
    }

    if (filters?.dateFilter && filters.dateFilter !== "ALL") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (7 - now.getDay())); // approx

      if (filters.dateFilter === "TODAY") {
        where.checkInDate = { gte: now, lt: tomorrow };
      } else if (filters.dateFilter === "TOMORROW") {
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        where.checkInDate = { gte: tomorrow, lt: dayAfter };
      } else if (filters.dateFilter === "THIS_WEEK") {
        where.checkInDate = { gte: now, lte: endOfWeek };
      }
    }

    return db.reservation.findMany({
      where,
      include: {
        guest: true,
        property: true,
        room: true,
      },
      orderBy: { checkInDate: "asc" },
    });
  },

  async getReservationById(id: string) {
    return db.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        property: true,
        room: true,
        activityLogs: {
          orderBy: { timestamp: "desc" },
          include: {
            // we don't have user relation on activity logs directly through prisma if actorId isn't linked?
            // Actually ActivityLog has actorId but not User relation. It's fine to just show actorId or nothing.
          }
        },
      },
    });
  },

  async createReservation(data: ReservationInput) {
    const validData = ReservationSchema.parse(data);
    
    // Validate Room belongs to Property
    const room = await db.room.findUnique({ where: { id: validData.roomId } });
    if (!room || room.propertyId !== validData.propertyId) {
      throw new Error("Invalid room for the selected property");
    }

    return db.reservation.create({ data: validData });
  },

  // Creates a Guest and a Reservation safely in a single transaction
  async createReservationWithNewGuest(guestData: GuestInput, reservationData: Omit<ReservationInput, "guestId">) {
    const validGuest = GuestSchema.parse(guestData);
    
    // We cannot fully parse reservationData yet because guestId is missing, but we can do it inside transaction.
    return db.$transaction(async (tx) => {
      const guest = await tx.guest.create({ data: validGuest });
      
      const fullResData = { ...reservationData, guestId: guest.id };
      const validResData = ReservationSchema.parse(fullResData);
      
      const room = await tx.room.findUnique({ where: { id: validResData.roomId } });
      if (!room || room.propertyId !== validResData.propertyId) {
        throw new Error("Invalid room for the selected property");
      }

      const reservation = await tx.reservation.create({ data: validResData });
      return { guest, reservation };
    });
  },
};
