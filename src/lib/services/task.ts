import { db } from "@/lib/db";
import { TaskInput, TaskSchema } from "../validation/task";
import { logActivity } from "./activity";
import { TaskStatus } from "@prisma/client";

export const taskService = {
  async getTasks(filters?: { status?: string; priority?: string; page?: number; pageSize?: number }) {
    let where: any = {};
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.priority && filters.priority !== "ALL") where.priority = filters.priority;

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      db.task.findMany({
        where,
        select: {
          id: true, title: true, priority: true, status: true, dueDate: true, createdAt: true,
          guest: { select: { id: true, firstName: true, lastName: true } },
          reservation: { select: { id: true, code: true, room: { select: { name: true } } } },
          assignedUser: { select: { id: true, name: true } },
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" }
        ],
        skip,
        take: pageSize,
      }),
      db.task.count({ where })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
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
