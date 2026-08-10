import { z } from "zod";

export const RoomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  propertyId: z.string().uuid("Invalid property ID"),
  airbnbIcalUrl: z.string().url().optional().nullable(),
  airbnbListingId: z.string().optional().nullable(),
  airbnbCalendarName: z.string().optional().nullable(),
  airbnbSyncEnabled: z.boolean().optional(),
});

export type RoomInput = z.infer<typeof RoomSchema>;
