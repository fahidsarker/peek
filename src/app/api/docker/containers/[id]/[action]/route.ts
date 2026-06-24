import { NextResponse } from "next/server";
import {
  pauseContainer,
  restartContainer,
  startContainer,
  stopContainer,
  unpauseContainer,
} from "@/lib/docker";
import { getSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string; action: string }>;
};

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

export async function POST(_request: Request, context: RouteContext) {
  const access = await requireDockerAccess();
  if (access.error) return access.error;

  const { id, action } = await context.params;

  try {
    switch (action) {
      case "restart":
        await restartContainer(id);
        break;
      case "pause":
        await pauseContainer(id);
        break;
      case "unpause":
        await unpauseContainer(id);
        break;
      case "start":
        await startContainer(id);
        break;
      case "stop":
        await stopContainer(id);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Docker action failed" }, { status: 500 });
  }
}
