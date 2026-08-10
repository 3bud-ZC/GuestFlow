import { z } from "zod";
import { ReservationPlatform, ReservationStatus } from "@prisma/client";

export const ReservationSchema = z.object({
  code: z.string().min(1, "Reservation code is required"),
  platform: z.nativeEnum(ReservationPlatform),
  guestId: z.string().uuid("Invalid guest ID").optional().nullable(),
  propertyId: z.string().uuid("Invalid property ID"),
  roomId: z.string().uuid("Invalid room ID"),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  numberOfGuests: z.number().int().min(1, "Must have at least 1 guest"),
  status: z.nativeEnum(ReservationStatus).default(ReservationStatus.CONFIRMED),
}).refine(data => data.checkOutDate > data.checkInDate, {
  message: "Check-out date must be after check-in date",
  path: ["checkOutDate"]
});

export type ReservationInput = z.infer<typeof ReservationSchema>;
