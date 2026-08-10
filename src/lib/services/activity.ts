import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function logActivity({
  reservationId,
  action,
  metadata,
}: {
  reservationId: string;
  action: string;
  metadata?: any;
}) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Ignore error if running in a background context (e.g. cron, tests)
  }

  return db.activityLog.create({
    data: {
      reservationId,
      action,
      metadata: metadata || {},
      actorId: user?.id || null,
    },
  });
}
