import { formatDistanceToNowStrict } from "date-fns";
import { NextResponse } from "next/server";
import { getContainerDetails, listContainers } from "@/lib/docker";
import { getSession } from "@/lib/session";

async function requireDockerAccess() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!session.user.showDocker) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const access = await requireDockerAccess();
  if (access.error) return access.error;

  try {
    const containers = await listContainers();
    const detailed = await Promise.all(
      containers.map(async (container) => {
        try {
          const details = await getContainerDetails(container.id);
          const runningFor =
            details.state === "running" && details.startedAt
              ? formatDistanceToNowStrict(new Date(details.startedAt))
              : null;

          return {
            ...container,
            state: details.state,
            startedAt: details.startedAt,
            runningFor,
          };
        } catch {
          return {
            ...container,
            runningFor: null,
          };
        }
      }),
    );

    return NextResponse.json({ containers: detailed });
  } catch {
    return NextResponse.json(
      { error: "Docker socket unavailable" },
      { status: 503 },
    );
  }
}
