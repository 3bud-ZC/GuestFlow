"use server";

import { requireRole } from "@/lib/auth";
import { messageTemplateService } from "@/lib/services/messageTemplate";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function updateTemplateAction(id: string, data: { metaTemplateName: string; languageCode: string; enabled: boolean; description?: string }) {
  await requireRole([Role.ADMIN]);

  try {
    const updated = await messageTemplateService.updateTemplate(id, data);
    revalidatePath("/messages/templates");
    return { success: true, template: updated };
  } catch (error: any) {
    console.error("Failed to update template", error);
    return { success: false, error: error.message || "Failed to update template" };
  }
}
