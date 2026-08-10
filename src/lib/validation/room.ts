import { z } from "zod";

export const RoomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  propertyId: z.string().uuid("Invalid property ID"),
});

export type RoomInput = z.infer<typeof RoomSchema>;
