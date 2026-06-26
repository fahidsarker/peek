import Docker from "dockerode";

let dockerInstance: Docker | null = null;

function getDocker() {
  if (!dockerInstance) {
    dockerInstance = new Docker({
      socketPath: process.env.DOCKER_SOCKET_PATH ?? "/var/run/docker.sock",
    });
  }
  return dockerInstance;
}

export type ContainerInfo = {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  startedAt: string | null;
};

export async function listContainers(): Promise<ContainerInfo[]> {
  const docker = getDocker();
  const containers = await docker.listContainers({ all: true });

  return containers.map((container) => ({
    id: container.Id,
    name: container.Names[0]?.replace(/^\//, "") ?? container.Id.slice(0, 12),
    image: container.Image,
    state: container.State,
    status: container.Status,
    startedAt: null,
  }));
}

export async function getContainerDetails(id: string) {
  const docker = getDocker();
  const container = docker.getContainer(id);
  const inspect = await container.inspect();
  return {
    id: inspect.Id,
    name: inspect.Name.replace(/^\//, ""),
    image: inspect.Config.Image,
    state: inspect.State.Status,
    startedAt: inspect.State.StartedAt || null,
  };
}

export async function restartContainer(id: string) {
  const docker = getDocker();
  await docker.getContainer(id).restart();
}

export async function pauseContainer(id: string) {
  const docker = getDocker();
  await docker.getContainer(id).pause();
}

export async function unpauseContainer(id: string) {
  const docker = getDocker();
  await docker.getContainer(id).unpause();
}

export async function startContainer(id: string) {
  const docker = getDocker();
  await docker.getContainer(id).start();
}

export async function stopContainer(id: string) {
  const docker = getDocker();
  await docker.getContainer(id).stop();
}
