"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EmbedHandoffProps = {
  baseUrl: string;
  allowedOrigins: string[];
};

export function EmbedHandoff({ baseUrl, allowedOrigins }: EmbedHandoffProps) {
  const embedUrl = `${baseUrl.replace(/\/$/, "")}/embed/map`;
  const snippet = useMemo(
    () =>
      `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  style="border:0;"
  loading="lazy"
  title="Fabuwood shipping territory map"
></iframe>`,
    [embedUrl],
  );
  const [copied, setCopied] = useState(false);

  const copySnippet = useCallback(async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [snippet]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Partner embed</h1>
        <p className="text-muted-foreground">
          Share a live territory map with partner websites via iframe. Only domains listed in{" "}
          <code className="text-xs">EMBED_ALLOWED_ORIGINS</code> may frame the embed route.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Embed URL</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="block rounded-md bg-muted px-3 py-2 text-sm break-all">{embedUrl}</code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Iframe snippet</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={copySnippet}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy code
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea readOnly value={snippet} rows={8} className="font-mono text-xs" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allowed partner domains</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {allowedOrigins.length > 0 ? (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {allowedOrigins.map((origin) => (
                <li key={origin}>
                  <code>{origin}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-amber-700">
              No partner domains configured. Set{" "}
              <code className="text-xs">EMBED_ALLOWED_ORIGINS</code> in Vercel (comma-separated
              origins, e.g. <code className="text-xs">https://dealer.example.com</code>). Until then,
              only your own site can preview the embed.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Always include both <code>https://example.com</code> and{" "}
            <code>https://www.example.com</code> if the partner uses both.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partner checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
            <li>Minimum recommended size: 900×600 px (width 100%, height 600–800).</li>
            <li>No login required — map loads live territory colors from SIP.</li>
            <li>Territory updates appear automatically when you edit assignments in admin.</li>
            <li>Partners must use <code>/embed/map</code>, not <code>/map</code>.</li>
            <li>
              Mapbox URL restrictions should allow your SIP production domain only (not partner
              domains).
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
