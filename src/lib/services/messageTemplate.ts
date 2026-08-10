import { db } from "../db";
import { MessageType } from "@prisma/client";

export const messageTemplateService = {
  getTemplates: async () => {
    return db.messageTemplate.findMany({
      orderBy: { type: "asc" }
    });
  },

  updateTemplate: async (id: string, data: { metaTemplateName: string; languageCode: string; enabled: boolean; description?: string }) => {
    return db.messageTemplate.update({
      where: { id },
      data,
    });
  },

  seedDefaultTemplates: async () => {
    const defaultTypes = [
      MessageType.WELCOME,
      MessageType.ID_REMINDER,
      MessageType.LOCATION,
      MessageType.CHECKIN_WELCOME,
      MessageType.CHECKOUT_REMINDER,
      MessageType.REVIEW_REQUEST
    ];

    const existing = await db.messageTemplate.findMany();
    const existingTypes = new Set(existing.map((t: { type: MessageType }) => t.type));

    const missing = defaultTypes.filter(t => !existingTypes.has(t));

    if (missing.length > 0) {
      await db.messageTemplate.createMany({
        data: missing.map(type => ({
          type,
          metaTemplateName: `guestflow_${type.toLowerCase()}`,
          languageCode: "en",
          enabled: false, // Default to disabled so they can safely configure it
        }))
      });
    }

    return missing.length;
  }
};
