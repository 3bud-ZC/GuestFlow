import { db } from "@/lib/db";
import { TaskInput, TaskSchema } from "../validation/task";
import { logActivity } from "./activity";
import { TaskStatus } from "@prisma/client";

export const taskService = {
  async getTasks(filters?: { status?: string; priority?: string }) {
    let where: any = {};
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.priority && filters.priority !== "ALL") where.priority = filters.priority;

    return db.task.findMany({
      where,
      include: {
        guest: true,
        reservation: true,
        assignedUser: true,
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ],
    });
  },

  async getTaskById(id: string) {
    return db.task.findUnique({
      where: { id },
      include: {
        guest: true,
        reservation: true,
        assignedUser: true,
      },
    });
  },

  async getOpenTasks() {
    return db.task.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      include: {
        guest: true,
        reservation: {
          include: {
            guest: true,
            room: true,
          }
        },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    });
  },

  async createTask(data: TaskInput, actorEmail?: string) {
    const validData = TaskSchema.parse(data);
    const task = await db.task.create({ data: validData });

    if (task.reservationId) {
      await logActivity({
        reservationId: task.reservationId,
        action: "TASK_CREATED",
        metadata: { title: task.title, priority: task.priority, createdBy: actorEmail },
      });
    }

    return task;
  },

  async updateTask(id: string, data: Partial<TaskInput>, actorEmail?: string) {
    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) throw new Error("Task not found");

    const updatedData: any = { ...data };
    
    if (data.status === TaskStatus.DONE && existing.status !== TaskStatus.DONE) {
      updatedData.completedAt = new Date();
    } else if (data.status && data.status !== TaskStatus.DONE && existing.status === TaskStatus.DONE) {
      updatedData.completedAt = null;
    }

    const task = await db.task.update({
      where: { id },
      data: updatedData,
    });

    if (task.reservationId && data.status === TaskStatus.DONE && existing.status !== TaskStatus.DONE) {
      await logActivity({
        reservationId: task.reservationId,
        action: "TASK_COMPLETED",
        metadata: { title: task.title, completedBy: actorEmail },
      });
    }

    return task;
  },
};
