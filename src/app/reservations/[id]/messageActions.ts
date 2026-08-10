"use server";

import { getCurrentUser } from "@/lib/auth";
import { messageService } from "@/lib/services/message";
import { MessageType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function sendManualMessageAction(reservationId: string, templateType: MessageType) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await messageService.sendManualMessage(reservationId, templateType, user.email);

  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath("/messages");
}
