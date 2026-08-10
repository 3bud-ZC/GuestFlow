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
  const airbnbIcalUrl = formData.get("airbnbIcalUrl") as string || undefined;
  const airbnbListingId = formData.get("airbnbListingId") as string || undefined;
  const airbnbCalendarName = formData.get("airbnbCalendarName") as string || undefined;

  await roomService.createRoom({
    name,
    propertyId,
    ...(airbnbIcalUrl ? {
      airbnbIcalUrl,
      airbnbListingId,
      airbnbCalendarName,
      airbnbSyncEnabled: true,
    } : {})
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function probeAirbnbConnectionAction(url: string) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");
  
  const { airbnbService } = await import('@/lib/services/airbnb');
  return airbnbService.probe(url);
}

export async function syncAirbnbAction(roomId: string, propertyId: string) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");
  
  const result = await roomService.syncAirbnbConnection(roomId);
  revalidatePath(`/properties/${propertyId}`);
  return result;
}

export async function disconnectAirbnbAction(roomId: string, propertyId: string) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");
  
  await roomService.disconnectAirbnbConnection(roomId);
  revalidatePath(`/properties/${propertyId}`);
}
