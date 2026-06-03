import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config();

const prisma = new PrismaClient();

function requireAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (password) return password;
  if (process.env.NODE_ENV === "production" || process.env.CI === "true") {
    throw new Error("ADMIN_PASSWORD is required in production and CI");
  }
  console.warn("WARNING: Using default dev password — set ADMIN_PASSWORD in .env");
  return "changeme";
}

async function main() {
  console.log("Seeding SIP database...");

  const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@example.com";
  const adminPassword = requireAdminPassword();
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
