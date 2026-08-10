"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { airbnbService } from "@/lib/services/airbnb";
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
    throw new Error("Invalid Airbnb calendar URL");
  }

  const result = await airbnbService.probe(url);
  if (!result.healthy) {
    throw new Error(result.error || "Probe failed");
  }

  return result;
}

export async function connectExistingRoom(roomId: string, url: string) {
  const user = await getCurrentUser();
  requireAdmin(user);
  
  await roomService.connectAirbnbConnection(roomId, url);
  return { success: true };
}

export async function connectNewRoom(propertyId: string, roomName: string, url: string) {
  const user = await getCurrentUser();
  requireAdmin(user);
  
  await roomService.createRoom({
    propertyId,
    name: roomName,
    airbnbIcalUrl: url,
  });
  return { success: true };
}
