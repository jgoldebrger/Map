import { EmbedHandoff } from "@/components/admin/EmbedHandoff";
import { getPublicAppUrl, parseEmbedAllowedOrigins } from "@/lib/embed-origins";

export default function AdminEmbedPage() {
  const baseUrl = getPublicAppUrl();
  const allowedOrigins = parseEmbedAllowedOrigins();

  return <EmbedHandoff baseUrl={baseUrl} allowedOrigins={allowedOrigins} />;
}
