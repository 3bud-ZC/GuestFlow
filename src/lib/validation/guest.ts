import { z } from "zod";
import { GuestDocumentStatus } from "@prisma/client";

export const GuestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  nationality: z.string().optional(),
  preferredLanguage: z.string().optional(),
  documentStatus: z.nativeEnum(GuestDocumentStatus).default(GuestDocumentStatus.PENDING),
});

export type GuestInput = z.infer<typeof GuestSchema>;
