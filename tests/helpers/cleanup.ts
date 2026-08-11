import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Deletes every QA record created by a given E2E run prefix (e.g. "GF-E2E-1699999999999").
// Deletion order respects FK constraints: Reservation (Restrict on guest/property/room)
// must go before Guest/Property; Property delete cascades Room + AvailabilityBlock;
// Reservation delete cascades Message/ActivityLog/Task.
export async function cleanupE2EData(prefix: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — cannot run QA cleanup. Set it before running the E2E suite.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const reservations = await prisma.reservation.findMany({ where: { code: { startsWith: prefix } } });
    if (reservations.length) {
      await prisma.reservation.deleteMany({ where: { id: { in: reservations.map(r => r.id) } } });
    }

    await prisma.task.deleteMany({ where: { title: { startsWith: prefix } } });
    await prisma.guest.deleteMany({ where: { firstName: { startsWith: prefix } } });
    await prisma.property.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix.toLowerCase() } } });

    return {
      reservationsDeleted: reservations.length,
    };
  } finally {
    await prisma.$disconnect();
  }
}
