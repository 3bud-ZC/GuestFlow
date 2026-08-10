"use server";

import { getCurrentUser } from "@/lib/auth";
import { reservationService } from "@/lib/services/reservation";
import { logActivity } from "@/lib/services/activity";
import { revalidatePath } from "next/cache";
import { ReservationPlatform, ReservationStatus, GuestDocumentStatus } from "@prisma/client";
import { automationService } from "@/lib/services/automation";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function createReservationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const isNewGuest = formData.get("isNewGuest") === "true";
  
  const reservationData = {
    code: formData.get("code") as string,
    platform: formData.get("platform") as ReservationPlatform,
    propertyId: formData.get("propertyId") as string,
    roomId: formData.get("roomId") as string,
    checkInDate: new Date(formData.get("checkInDate") as string),
    checkOutDate: new Date(formData.get("checkOutDate") as string),
    numberOfGuests: parseInt(formData.get("numberOfGuests") as string, 10),
    status: ReservationStatus.CONFIRMED,
  };

  let reservationId;

  if (isNewGuest) {
    const guestData = {
      firstName: formData.get("guestFirstName") as string,
      lastName: formData.get("guestLastName") as string,
      email: formData.get("guestEmail") as string || undefined,
      phone: formData.get("guestPhone") as string || undefined,
      documentStatus: GuestDocumentStatus.PENDING,
    };
    
    const result = await reservationService.createReservationWithNewGuest(guestData, reservationData);
    reservationId = result.reservation.id;
  } else {
    const guestId = formData.get("guestId") as string;
    if (!guestId) throw new Error("Guest is required");
    
    const result = await reservationService.createReservation({ ...reservationData, guestId });
    reservationId = result.id;
  }

  // Auto-task creation: Missing Phone
  const reservation = await reservationService.getReservationById(reservationId);
  if (reservation && reservation.guest && !reservation.guest.phone) {
    await db.task.create({
      data: {
        title: "Get guest phone number",
        description: "Guest does not have a phone number on file.",
        priority: "MEDIUM",
        status: "OPEN",
        reservationId: reservation.id,
        guestId: reservation.guest.id,
      }
    });
  }

  await automationService.onReservationCreated(reservationId);

  await logActivity({
    reservationId,
    action: "RESERVATION_CREATED",
    metadata: { createdBy: user.email },
  });

  revalidatePath("/reservations");
  redirect(`/reservations/${reservationId}`);
}

export async function updateReservationStatusAction(id: string, status: ReservationStatus) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Basic transition check: check-out > check-in
  const currentRes = await db.reservation.findUnique({ where: { id } });
  if (!currentRes) throw new Error("Not found");

  if (status === 'CHECKED_OUT' && currentRes.status !== 'CHECKED_IN') {
    throw new Error("Cannot checkout before checkin");
  }

  await db.reservation.update({
    where: { id },
    data: { 
      status,
      actualCheckInAt: status === 'CHECKED_IN' ? new Date() : currentRes.actualCheckInAt,
      actualCheckOutAt: status === 'CHECKED_OUT' ? new Date() : currentRes.actualCheckOutAt,
    },
  });

  if (status === 'CHECKED_IN') {
    await automationService.onCheckIn(id);
  } else if (status === 'CHECKED_OUT') {
    await automationService.onCheckOut(id);
  } else if (status === 'CANCELLED') {
    await automationService.onCancel(id);
  }

  await logActivity({
    reservationId: id,
    action: "STATUS_CHANGED",
    metadata: { newStatus: status, changedBy: user.email },
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
}
