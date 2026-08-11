"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { airbnbService, AirbnbError } from "@/lib/services/airbnb";
import { roomService } from "@/lib/services/room";

function requireAdmin(user: any) {
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function getPropertiesAndRooms() {
  const user = await getCurrentUser();
  requireAdmin(user);

  return db.property.findMany({
    include: {
      rooms: {
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });
}

export async function probeAirbnbUrl(url: string) {
  const user = await getCurrentUser();
  requireAdmin(user);

  if (!airbnbService.validateUrl(url)) {
    return {
      healthy: false as const,
      errorCode: "AIRBNB_URL_INVALID",
      error: "The Airbnb calendar link format is not valid. Please copy the link directly from Airbnb › Calendar › Export Calendar.",
      errorAr: "تنسيق رابط تقويم Airbnb غير صحيح. يرجى نسخ الرابط مباشرةً من Airbnb › التقويم › تصدير التقويم.",
    };
  }

  const result = await airbnbService.probe(url);
  return result;
}

type ConnectResult =
  | { success: true }
  | { success: false; errorCode: string; error: string; errorAr: string };

// Server Actions that `throw` in production have their Error.message
// redacted by Next.js before it reaches the client (only a digest survives).
// Expected/validation failures must therefore be returned as structured
// data, not thrown, so the UI can show a specific, localized message.
export async function connectExistingRoom(roomId: string, url: string): Promise<ConnectResult> {
  const user = await getCurrentUser();
  requireAdmin(user);

  if (!roomId) {
    return {
      success: false,
      errorCode: "ROOM_REQUIRED",
      error: "Please select a room to connect.",
      errorAr: "يرجى اختيار غرفة للربط.",
    };
  }

  try {
    await roomService.connectAirbnbConnection(roomId, url);
    return { success: true };
  } catch (e: any) {
    if (e instanceof AirbnbError) {
      return { success: false, errorCode: e.code, error: e.userMessage.en, errorAr: e.userMessage.ar };
    }
    return {
      success: false,
      errorCode: "AIRBNB_SYNC_FAILED",
      error: "Failed to connect the calendar. Please try again.",
      errorAr: "فشل ربط التقويم. يرجى المحاولة مرة أخرى.",
    };
  }
}

export async function connectNewRoom(propertyId: string, roomName: string, url: string): Promise<ConnectResult> {
  const user = await getCurrentUser();
  requireAdmin(user);

  if (!propertyId) {
    return {
      success: false,
      errorCode: "PROPERTY_REQUIRED",
      error: "Please select a property.",
      errorAr: "يرجى اختيار عقار.",
    };
  }
  if (!roomName?.trim()) {
    return {
      success: false,
      errorCode: "ROOM_NAME_REQUIRED",
      error: "Please enter a room name.",
      errorAr: "يرجى إدخال اسم الغرفة.",
    };
  }

  try {
    await roomService.createRoom({
      propertyId,
      name: roomName.trim(),
      airbnbIcalUrl: url,
      airbnbSyncEnabled: true, // ensure sync is enabled for new rooms
    });
    return { success: true };
  } catch (e: any) {
    if (e instanceof AirbnbError) {
      return { success: false, errorCode: e.code, error: e.userMessage.en, errorAr: e.userMessage.ar };
    }
    return {
      success: false,
      errorCode: "AIRBNB_SYNC_FAILED",
      error: "Failed to connect the calendar. Please try again.",
      errorAr: "فشل ربط التقويم. يرجى المحاولة مرة أخرى.",
    };
  }
}
