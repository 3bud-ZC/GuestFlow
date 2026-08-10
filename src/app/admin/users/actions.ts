"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUser(data: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }

  const name = data.get("name") as string;
  const email = data.get("email") as string;
  const password = data.get("password") as string;
  const role = data.get("role") as Role;

  if (!name || !email || !password || !role) {
    throw new Error("Missing required fields");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }

  if (currentUser.id === userId) {
    throw new Error("Cannot delete yourself");
  }

  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}
