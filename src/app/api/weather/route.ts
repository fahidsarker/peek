import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getWeather } from "@/lib/weather";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const weather = await getWeather();
    return NextResponse.json({ weather });
  } catch {
    return NextResponse.json({ weather: null });
  }
}
