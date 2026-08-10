"use server";

import { getCurrentUser } from "@/lib/auth";
import { taskService } from "@/lib/services/task";
import { revalidatePath } from "next/cache";
import { TaskPriority, TaskStatus } from "@prisma/client";

export async function createTaskAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string || undefined;
  const priority = formData.get("priority") as TaskPriority;
  const reservationId = formData.get("reservationId") as string || undefined;
  const guestId = formData.get("guestId") as string || undefined;
  
  // Basic empty checks
  const data = {
    title,
    description,
    priority,
    reservationId: reservationId?.trim() === "" ? undefined : reservationId,
    guestId: guestId?.trim() === "" ? undefined : guestId,
    status: TaskStatus.OPEN,
  };

  await taskService.createTask(data, user.email);

  revalidatePath("/tasks");
}

export async function updateTaskStatusAction(id: string, status: TaskStatus) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await taskService.updateTask(id, { status }, user.email);

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
}
