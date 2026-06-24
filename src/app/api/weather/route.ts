import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getWeather, getWeatherConfig } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getWeatherConfig();
  const latParam = request.nextUrl.searchParams.get("lat");
  const lonParam = request.nextUrl.searchParams.get("lon");

  const lat = latParam ? Number(latParam) : undefined;
  const lon = lonParam ? Number(lonParam) : undefined;

  try {
    const weather = await getWeather({
      lat: Number.isFinite(lat) ? lat : undefined,
      lon: Number.isFinite(lon) ? lon : undefined,
    });
    return NextResponse.json({ weather, useCurrentLocation: config.useCurrentLocation });
  } catch {
    return NextResponse.json({ weather: null, useCurrentLocation: config.useCurrentLocation });
  }
}
