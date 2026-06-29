import { formatDistanceToNowStrict } from "date-fns";
import {
  getContainerDetails,
  getContainerStats,
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

export async function getDockerContainerDetail(id: string) {
  const details = await getContainerDetails(id);
  const listed = (await listContainers()).find((c) => c.id === details.id);
  const runningFor =
    details.state === "running" && details.startedAt
      ? formatDistanceToNowStrict(new Date(details.startedAt))
      : null;
  const stats =
    details.state === "running" ? await getContainerStats(id) : null;

  return {
    ...details,
    status: listed?.status ?? details.status,
    runningFor,
    stats,
  };
}
