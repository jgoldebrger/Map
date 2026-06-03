import {
  buildFrameAncestorsDirective,
  buildEmbedIframeSnippet,
  parseEmbedAllowedOrigins,
} from "../src/lib/embed-origins";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const origins = parseEmbedAllowedOrigins(
  "https://dealer.example.com, https://www.dealer.example.com",
);
assert(origins.length === 2, "expected two parsed origins");
assert(origins[0] === "https://dealer.example.com", "first origin mismatch");

const csp = buildFrameAncestorsDirective(origins);
assert(csp.includes("'self'"), "CSP must include self");
assert(csp.includes("https://dealer.example.com"), "CSP must include partner origin");

const snippet = buildEmbedIframeSnippet("https://map.example.com");
assert(snippet.includes("https://map.example.com/embed/map"), "snippet must use embed path");
assert(snippet.includes("<iframe"), "snippet must be iframe HTML");

assert(parseEmbedAllowedOrigins("").length === 0, "empty env should yield no origins");

console.log("embed-origins tests passed");
