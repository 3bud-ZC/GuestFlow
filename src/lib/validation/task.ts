import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

export const TaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.OPEN),
  dueDate: z.coerce.date().optional().or(z.literal("").transform(() => undefined)),
  reservationId: z.string().uuid("Invalid reservation ID").optional().or(z.literal("").transform(() => undefined)),
  guestId: z.string().uuid("Invalid guest ID").optional().or(z.literal("").transform(() => undefined)),
  assignedUserId: z.string().uuid("Invalid user ID").optional().or(z.literal("").transform(() => undefined)),
});

export type TaskInput = z.infer<typeof TaskSchema>;
