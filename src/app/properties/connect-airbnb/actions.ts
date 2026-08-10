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

export async function connectExistingRoom(roomId: string, url: string) {
  const user = await getCurrentUser();
  requireAdmin(user);

  if (!roomId) {
    throw new Error("Please select a room to connect.");
  }

  try {
    await roomService.connectAirbnbConnection(roomId, url);
    return { success: true };
  } catch (e: any) {
    if (e instanceof AirbnbError) {
      throw new Error(e.userMessage.en);
    }
    throw e;
  }
}

export async function connectNewRoom(propertyId: string, roomName: string, url: string) {
  const user = await getCurrentUser();
  requireAdmin(user);

  if (!propertyId) {
    throw new Error("Please select a property.");
  }
  if (!roomName?.trim()) {
    throw new Error("Please enter a room name.");
  }

  try {
    await roomService.createRoom({
      propertyId,
      name: roomName.trim(),
      airbnbIcalUrl: url,
      airbnbSyncEnabled: true, // FIX: ensure sync is enabled for new rooms
    });
    return { success: true };
  } catch (e: any) {
    if (e instanceof AirbnbError) {
      throw new Error(e.userMessage.en);
    }
    throw e;
  }
}
