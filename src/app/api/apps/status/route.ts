import { NextResponse } from "next/server";
import { getAppsWithStatus } from "@/lib/ping";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";
  const apps = await getAppsWithStatus(refresh);

  return NextResponse.json({ apps });
}
