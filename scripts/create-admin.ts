import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  const email = process.env.ADMIN_EMAIL?.trim() || "admin@example.com";
  const password = requireAdminPassword();
  const name = process.env.ADMIN_NAME?.trim() || "Super Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "SUPER_ADMIN", name },
    create: { email, name, passwordHash, role: "SUPER_ADMIN" },
  });

  console.log(`Admin user ready: ${user.email} (${user.role})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
