import { z } from "zod";
import { MessageType } from "@prisma/client";

export const MessageTemplateSchema = z.object({
  type: z.nativeEnum(MessageType),
  metaTemplateName: z.string().min(1, "Meta template name is required"),
  languageCode: z.string().min(2, "Language code is required (e.g. en_US)"),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
});

export type MessageTemplateInput = z.infer<typeof MessageTemplateSchema>;
