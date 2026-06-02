/**
 * Remove "Common Carrier (Default)" territory and unassign its counties.
 *
 * Usage: npx tsx scripts/remove-default-territory.ts
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config();

const TERRITORY_NAME = "Common Carrier (Default)";

async function main() {
  const prisma = new PrismaClient();

  const territory = await prisma.territory.findFirst({
    where: { name: TERRITORY_NAME },
  });

  if (!territory) {
    console.log(`"${TERRITORY_NAME}" not found — nothing to do.`);
    await prisma.$disconnect();
    return;
  }

  const { count: assignmentsRemoved } = await prisma.countyAssignment.deleteMany({
    where: { territoryId: territory.id },
  });

  await prisma.territory.delete({ where: { id: territory.id } });

  console.log(`Removed "${TERRITORY_NAME}" and cleared ${assignmentsRemoved} county assignments.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
