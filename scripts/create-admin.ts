import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "jgoldberger@fabuwood.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme";
  const name = process.env.ADMIN_NAME ?? "Super Admin";

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
