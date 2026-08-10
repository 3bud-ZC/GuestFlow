"use server";

import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { propertyService } from "@/lib/services/property";
import { roomService } from "@/lib/services/room";
import { revalidatePath } from "next/cache";

export async function createPropertyAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const address = formData.get("address") as string || undefined;
  const googleMapsUrl = formData.get("googleMapsUrl") as string || undefined;
  const wifiName = formData.get("wifiName") as string || undefined;
  const wifiPassword = formData.get("wifiPassword") as string || undefined;

  await propertyService.createProperty({
    name,
    address,
    googleMapsUrl,
    wifiName,
    wifiPassword,
  });

  revalidatePath("/properties");
}

export async function createRoomAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const propertyId = formData.get("propertyId") as string;

  await roomService.createRoom({
    name,
    propertyId,
  });

  revalidatePath(`/properties/${propertyId}`);
}
