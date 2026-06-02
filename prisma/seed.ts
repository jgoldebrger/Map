import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SIP database...");

  const adminEmail = process.env.ADMIN_EMAIL ?? "jgoldberger@fabuwood.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "SUPER_ADMIN", name: "Super Admin" },
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Seed complete.");
  console.log(`Admin: ${adminEmail}`);
  console.log("Create shipping methods and territories in Admin — nothing is pre-configured.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
