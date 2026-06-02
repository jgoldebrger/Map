/**
 * Build PMTiles from us-counties.geojson (requires tippecanoe installed).
 * Fallback: copies GeoJSON for client-side loading if tippecanoe unavailable.
 *
 * Usage: npm run build:pmtiles
 */
import { existsSync, copyFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const geoIn = join(root, "public/geo/us-counties.geojson");
const tilesDir = join(root, "public/tiles");
const pmtilesOut = join(tilesDir, "us-counties.pmtiles");

async function main() {
  if (!existsSync(geoIn)) {
    console.error("Run import:counties first to generate us-counties.geojson");
    process.exit(1);
  }

  mkdirSync(tilesDir, { recursive: true });

  try {
    execSync("tippecanoe --version", { stdio: "pipe" });
    console.log("Building PMTiles with tippecanoe...");
    execSync(
      `tippecanoe -o "${pmtilesOut}" -zg --drop-densest-as-needed --extend-zoom-if-still-dropping -l counties "${geoIn}"`,
      { stdio: "inherit" }
    );
    console.log(`PMTiles written to ${pmtilesOut}`);
  } catch {
    console.warn("tippecanoe not found — map will use GeoJSON source instead.");
    const geoCopy = join(tilesDir, "us-counties.geojson");
    copyFileSync(geoIn, geoCopy);
    console.log(`Copied GeoJSON to ${geoCopy}`);
  }
}

main().catch(console.error);
