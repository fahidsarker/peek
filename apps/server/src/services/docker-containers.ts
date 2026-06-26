import { formatDistanceToNowStrict } from "date-fns";
import {
  getContainerDetails,
  listContainers,
} from "../services/docker";

export async function getDockerContainersDetailed() {
  const containers = await listContainers();
  return Promise.all(
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
        return { ...container, runningFor: null };
      }
    }),
  );
}
