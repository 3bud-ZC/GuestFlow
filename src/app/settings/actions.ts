"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updatePropertySettingsAction(propertyId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

  const address = formData.get("address") as string;
  const googleMapsUrl = formData.get("googleMapsUrl") as string;
  const wifiName = formData.get("wifiName") as string;
  const wifiPassword = formData.get("wifiPassword") as string;

  const checkInTime = formData.get("checkInTime") as string;
  const checkOutTime = formData.get("checkOutTime") as string;
  const timezone = formData.get("timezone") as string;

  const instagramUrl = formData.get("instagramUrl") as string;
  const facebookUrl = formData.get("facebookUrl") as string;
  const tiktokUrl = formData.get("tiktokUrl") as string;

  const welcomeEnabled = formData.get("welcomeEnabled") === "on";
  const idReminderEnabled = formData.get("idReminderEnabled") === "on";
  const locationEnabled = formData.get("locationEnabled") === "on";
  const checkoutReminderEnabled = formData.get("checkoutReminderEnabled") === "on";
  const reviewRequestEnabled = formData.get("reviewRequestEnabled") === "on";

  const idReminderOffsetHours = parseInt(formData.get("idReminderOffsetHours") as string) || 24;
  const locationOffsetHours = parseInt(formData.get("locationOffsetHours") as string) || 24;
  const checkoutOffsetHours = parseInt(formData.get("checkoutOffsetHours") as string) || 24;

  // Update Property Base
  await db.property.update({
    where: { id: propertyId },
    data: {
      address,
      googleMapsUrl,
      wifiName,
      wifiPassword
    }
  });

  // Upsert PropertySettings
  await db.propertySettings.upsert({
    where: { propertyId },
    create: {
      propertyId,
      checkInTime: checkInTime || "15:00",
      checkOutTime: checkOutTime || "11:00",
      timezone: timezone || "UTC",
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      welcomeEnabled,
      idReminderEnabled,
      locationEnabled,
      checkoutReminderEnabled,
      reviewRequestEnabled,
      idReminderOffsetHours,
      locationOffsetHours,
      checkoutOffsetHours
    },
    update: {
      checkInTime: checkInTime || "15:00",
      checkOutTime: checkOutTime || "11:00",
      timezone: timezone || "UTC",
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      welcomeEnabled,
      idReminderEnabled,
      locationEnabled,
      checkoutReminderEnabled,
      reviewRequestEnabled,
      idReminderOffsetHours,
      locationOffsetHours,
      checkoutOffsetHours
    }
  });

  revalidatePath("/settings");
}
