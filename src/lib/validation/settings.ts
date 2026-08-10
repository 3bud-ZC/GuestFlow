import { z } from "zod";

const TimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM

export const PropertySettingsSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  checkInTime: z.string().regex(TimeRegex, "Must be in HH:MM format"),
  checkOutTime: z.string().regex(TimeRegex, "Must be in HH:MM format"),
  timezone: z.string().min(1, "Timezone is required"),
});

export type PropertySettingsInput = z.infer<typeof PropertySettingsSchema>;
