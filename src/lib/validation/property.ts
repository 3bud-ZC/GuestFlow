import { z } from "zod";

export const PropertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  googleMapsUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
});

export type PropertyInput = z.infer<typeof PropertySchema>;
