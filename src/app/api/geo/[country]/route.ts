import { statesOf } from "@/lib/geo";

// States / provinces of a country, for the address dropdowns. The data never changes between
// deploys, so browsers and the CDN may keep it for a long time.
const CACHE = "public, max-age=86400, s-maxage=2592000";

export async function GET(_request: Request, { params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  if (!/^[A-Za-z]{2}$/.test(country)) return Response.json([], { status: 400 });
  return Response.json(statesOf(country.toUpperCase()), { headers: { "Cache-Control": CACHE } });
}
