import "dotenv/config";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db as prisma } from "../src/lib/db";

async function main() {
  console.log("Seeding database...");

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || "System Admin";

  if (!adminEmail || !adminPassword) {
    console.log("Skipping ADMIN bootstrap: BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD not set.");
  } else {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`ADMIN account ${adminEmail} already exists. Skipping.`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: Role.ADMIN,
        },
      });
      console.log(`Created ADMIN account: ${adminEmail}`);
    }
  }

  const receptionEmail = process.env.BOOTSTRAP_RECEPTION_EMAIL;
  const receptionPassword = process.env.BOOTSTRAP_RECEPTION_PASSWORD;
  
  if (!receptionEmail || !receptionPassword) {
    console.log("Skipping RECEPTION bootstrap.");
  } else {
    const existingReception = await prisma.user.findUnique({
      where: { email: receptionEmail },
    });

    if (existingReception) {
      console.log(`RECEPTION account ${receptionEmail} already exists. Skipping.`);
    } else {
      const hashedPassword = await bcrypt.hash(receptionPassword, 10);
      await prisma.user.create({
        data: {
          email: receptionEmail,
          password: hashedPassword,
          name: "Reception Desk",
          role: Role.RECEPTION,
        },
      });
      console.log(`Created RECEPTION account: ${receptionEmail}`);
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
