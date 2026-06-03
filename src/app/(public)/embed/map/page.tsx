import type { Metadata } from "next";
import { MapPageContent } from "@/components/map/MapPageContent";

export const metadata: Metadata = {
  title: "Fabuwood shipping territory map",
  description: "Live shipping territory map for Fabuwood partners",
};

export default function EmbedMapPage() {
  return <MapPageContent variant="embed" />;
}
