import type { NextConfig } from "next";
import {
  buildFrameAncestorsDirective,
  parseEmbedAllowedOrigins,
} from "./src/lib/embed-origins";

const embedFrameAncestors = buildFrameAncestorsDirective(parseEmbedAllowedOrigins());

const denyFramingHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["mapbox-gl"],
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: embedFrameAncestors,
          },
        ],
      },
      { source: "/map", headers: denyFramingHeaders },
      { source: "/lookup", headers: denyFramingHeaders },
      { source: "/login", headers: denyFramingHeaders },
      { source: "/admin/:path*", headers: denyFramingHeaders },
      { source: "/", headers: denyFramingHeaders },
    ];
  },
};

export default nextConfig;
