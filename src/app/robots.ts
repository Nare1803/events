import type { MetadataRoute } from "next";

/** Dashboard and APIs are never crawled; each invitation sets its own robots meta (noindex by default). */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: ["/admin", "/api/invitations/", "/api/intake", "/login", "/review/"] }] };
}
