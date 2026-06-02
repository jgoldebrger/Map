/**
 * Backfill ZipCode.city from zipcodes dataset (fixes "Unknown" from Census-only import).
 *
 * Usage: npm run backfill:zip-cities
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { lookupZipCity } from "./lib/zip-cities";

config();

async function main() {
  const prisma = new PrismaClient();

  const zips = await prisma.zipCode.findMany({
    select: { id: true, zip: true, city: true },
  });

  console.log(`Updating cities for ${zips.length} ZIP codes...`);
  const BATCH = 100;
  let updated = 0;
  let unchanged = 0;

  for (let i = 0; i < zips.length; i += BATCH) {
    const batch = zips.slice(i, i + BATCH);
    const updates = batch
      .map((row) => {
        const city = lookupZipCity(row.zip);
        if (!city || city === row.city) {
          unchanged++;
          return null;
        }
        updated++;
        return prisma.zipCode.update({
          where: { id: row.id },
          data: { city },
        });
      })
      .filter((op): op is ReturnType<typeof prisma.zipCode.update> => op !== null);

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH, zips.length)} / ${zips.length}`);
  }

  console.log(`\nDone. ${updated} cities updated, ${unchanged} unchanged or not in dataset.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
