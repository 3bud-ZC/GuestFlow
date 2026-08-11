"use server";

import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { propertyService } from "@/lib/services/property";
import { roomService } from "@/lib/services/room";
import { revalidatePath } from "next/cache";
import { AirbnbError } from "@/lib/services/airbnb";

function toActionError(e: any): { success: false; errorCode: string; error: string; errorAr: string } {
  if (e instanceof AirbnbError) {
    return { success: false, errorCode: e.code, error: e.userMessage.en, errorAr: e.userMessage.ar };
  }
  return {
    success: false,
    errorCode: "UNKNOWN",
    error: "Something went wrong. Please try again.",
    errorAr: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  };
}

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

export async function updatePropertyAction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const address = formData.get("address") as string || undefined;
  const googleMapsUrl = formData.get("googleMapsUrl") as string || undefined;
  const wifiName = formData.get("wifiName") as string || undefined;
  const wifiPassword = formData.get("wifiPassword") as string || undefined;

  await propertyService.updateProperty(id, {
    name,
    address,
    googleMapsUrl,
    wifiName,
    wifiPassword,
  });

  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
}

export async function createRoomAction(formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const propertyId = formData.get("propertyId") as string;
  const airbnbIcalUrl = formData.get("airbnbIcalUrl") as string || undefined;

  try {
    await roomService.createRoom({
      name,
      propertyId,
      ...(airbnbIcalUrl ? {
        airbnbIcalUrl,
        airbnbSyncEnabled: true,
      } : {})
    });
  } catch (e: any) {
    return toActionError(e);
  }

  revalidatePath(`/properties/${propertyId}`);
  return { success: true as const };
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

  try {
    const result = await roomService.syncAirbnbConnection(roomId);
    revalidatePath(`/properties/${propertyId}`);
    return result;
  } catch (e: any) {
    return toActionError(e);
  }
}

export async function disconnectAirbnbAction(roomId: string, propertyId: string) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");

  try {
    await roomService.disconnectAirbnbConnection(roomId);
  } catch (e: any) {
    return toActionError(e);
  }
  revalidatePath(`/properties/${propertyId}`);
  return { success: true as const };
}

export async function connectAirbnbAction(roomId: string, propertyId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== Role.ADMIN) throw new Error("Unauthorized");

  const airbnbIcalUrl = formData.get("airbnbIcalUrl") as string;

  try {
    const result = await roomService.connectAirbnbConnection(roomId, airbnbIcalUrl);
    revalidatePath(`/properties/${propertyId}`);
    return result;
  } catch (e: any) {
    return toActionError(e);
  }
}
