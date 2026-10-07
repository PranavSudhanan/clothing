import { citiesOf } from "@/lib/geo";

// Cities of a state, for the address dropdowns.
const CACHE = "public, max-age=86400, s-maxage=2592000";

export async function GET(_request: Request, { params }: { params: Promise<{ country: string; state: string }> }) {
  const { country, state } = await params;
  if (!/^[A-Za-z]{2}$/.test(country) || !/^[A-Za-z0-9-]{1,8}$/.test(state)) return Response.json([], { status: 400 });
  return Response.json(citiesOf(country.toUpperCase(), state.toUpperCase()), { headers: { "Cache-Control": CACHE } });
}
