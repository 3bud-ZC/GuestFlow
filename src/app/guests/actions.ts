"use server";

import { getCurrentUser } from "@/lib/auth";
import { guestService } from "@/lib/services/guest";
import { logActivity } from "@/lib/services/activity";
import { revalidatePath } from "next/cache";
import { GuestDocumentStatus } from "@prisma/client";
import { automationService } from "@/lib/services/automation";

export async function createGuestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string || undefined;
  const phone = formData.get("phone") as string || undefined;
  const nationality = formData.get("nationality") as string || undefined;
  const preferredLanguage = formData.get("preferredLanguage") as string || undefined;

  await guestService.createGuest({
    firstName,
    lastName,
    email,
    phone,
    nationality,
    preferredLanguage,
    documentStatus: GuestDocumentStatus.PENDING,
  });

  revalidatePath("/guests");
}

export async function updateGuestAction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string || undefined;
  const phone = formData.get("phone") as string || undefined;
  const nationality = formData.get("nationality") as string || undefined;
  const preferredLanguage = formData.get("preferredLanguage") as string || undefined;

  await guestService.updateGuest(id, {
    firstName,
    lastName,
    email,
    phone,
    nationality,
    preferredLanguage,
    documentStatus: formData.get("documentStatus") as GuestDocumentStatus || undefined,
  });

  if (formData.get("documentStatus") === 'RECEIVED') {
    await automationService.onGuestIdReceived(id);
  }

  revalidatePath(`/guests/${id}`);
  revalidatePath("/guests");
}

export async function updateGuestDocumentStatusAction(id: string, status: GuestDocumentStatus) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const guest = await guestService.getGuestById(id);
  if (!guest) throw new Error("Guest not found");

  await guestService.updateGuest(id, {
    firstName: guest.firstName,
    lastName: guest.lastName,
    documentStatus: status,
  });

  if (status === 'RECEIVED') {
    await automationService.onGuestIdReceived(id);
  }

  // Log activity on reservations if this was done from a reservation context?
  // We can just revalidate paths for now
  revalidatePath(`/guests/${id}`);
  revalidatePath("/reservations");
}
