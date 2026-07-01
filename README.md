<p align="center">
  <img src="https://github.com/fahidsarker/peek/blob/main/assets/banner.png" alt="peek — ultra-minimal NAS dashboard" width="100%" />
</p>

<p align="center">
  Ultra-minimal dashboard for NAS or self-hosted servers.<br />
  Welcome header with date, time, and weather; host system metrics (CPU, RAM, disk, network); user-managed app shortcuts with health pings; Docker container list with restart and pause/start controls.
</p>

---

## Stack

- **Backend:** Bun + Fastify + Socket.IO
- **Frontend:** Vite + React 19 SPA
- **Database:** Postgres + Drizzle ORM
- **Auth:** Custom session cookies + `Bun.password` (argon2id)
- **Docker:** dockerode
- **Styling:** Tailwind CSS v4

## Quick start

### 1. Environment

```bash
cp .env.example .env
```

Set `SESSION_SECRET` to a long random string. For local dev, `APP_URL=http://localhost:5173`.

### 2. Database

```bash
docker run -d --name peek-db \
  -e POSTGRES_USER=peek \
  -e POSTGRES_PASSWORD=peek \
  -e POSTGRES_DB=peek \
  -p 5432:5432 \
  -v peek_pg_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

Apply schema:

```bash
bun install
bun run db:push
```

### 3. Development

Run the API server and Vite dev server:

```bash
# Terminal 1
bun run --filter @peek/server dev

# Terminal 2
bun run --filter @peek/web dev
```

Open [http://localhost:5173](http://localhost:5173). The **first user to sign up becomes admin** with Docker access.

## Docker deployment

Pre-built image: [`fahidsarker/peek`](https://hub.docker.com/r/fahidsarker/peek) on Docker Hub (`latest` and release tags such as `v0.5.1`). The container runs database migrations on startup — no local `bun install` or `db:push` required.

Save as `compose.yaml` (or add to an existing stack). Set `SESSION_SECRET` to a long random string. If Peek is not accessed at `http://localhost:3000`, set `APP_URL` to your public URL (required for CORS).

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: peek
      POSTGRES_PASSWORD: peek
      POSTGRES_DB: peek
    volumes:
      - peek_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U peek -d peek"]
      interval: 5s
      timeout: 5s
      retries: 5

  peek:
    image: fahidsarker/peek:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://peek:peek@db:5432/peek
      SESSION_SECRET: ${SESSION_SECRET:-change-me-to-a-long-random-string}
      APP_URL: ${APP_URL:-http://localhost:3000}
      DOCKER_SOCKET_PATH: /var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      db:
        condition: service_healthy

volumes:
  peek_pg_data:
```

```bash
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000). The **first user to sign up becomes admin** with Docker access.

To pin a release instead of `latest`:

```yaml
image: fahidsarker/peek:v1.0.0
```

### Build from source

Clone this repo, then replace `image: fahidsarker/peek:latest` with `build: .` on the `peek` service and run:

```bash
docker compose up -d --build
```

> **Warning — system metrics in Docker:** By default, the compose above reports **container** metrics, not the host. Network speed will look very low (a few B/s) except when the Peek UI itself is loading, because the container only sees its own `eth0` traffic. CPU, RAM, and disk may also reflect the container rather than the host.
>
> To show **host** metrics on Linux, add these volumes and env vars to the `peek` service. Do not mount over `/proc` inside the container — use `/host/proc` instead.

```yaml
peek:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
    - /:/rootfs:ro
  environment:
    HOST_PROC_ROOT: /host/proc
    HOST_SYS_ROOT: /host/sys
    HOST_ROOTFS: /rootfs
```

### System metrics — platform support

| How you run Peek                           | Linux             | macOS             | Windows           |
| ------------------------------------------ | ----------------- | ----------------- | ----------------- |
| **Native** (`bun run dev` / not in Docker) | Host metrics      | Host metrics      | Host metrics      |
| **Docker** (default compose)               | Container metrics | Container metrics | Container metrics |
| **Docker** + host mounts above             | Host metrics      | VM metrics only   | VM metrics only   |

**Native installs** use `systeminformation` and report the real host on all three OSes.

**Docker (default)** works on all platforms, but metrics are scoped to the Peek container. Network will look very low except when the UI is loading, because the container only sees its own traffic.

**Docker + host mounts** (`HOST_PROC_ROOT`, etc.) reads Linux `/proc` and `/sys`. This is intended for **Linux servers and NAS hosts**:

- On **Linux**, mounting `/proc`, `/sys`, and `/` exposes the real host. This is the recommended setup for Docker on a NAS or self-hosted Linux box.
- On **macOS and Windows** (Docker Desktop), containers run inside a Linux VM. Those mounts expose the **Docker VM**, not your Mac or Windows host. Do not expect accurate Mac/Windows network, CPU, or disk stats from this path. For real host metrics on Mac or Windows, run Peek natively instead of in Docker.

Other notes:

- Mounts must be **read-only** (`:ro`). Do not mount over `/proc` inside the container — use `/host/proc` instead.
- Network rates need one poll interval (~2s) before non-zero values appear.

## Environment variables

| Variable             | Description                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Postgres connection string                                                                                  |
| `SESSION_SECRET`     | Secret for cookie signing                                                                                   |
| `APP_URL`            | Client origin for CORS (dev: `http://localhost:5173`, prod: `http://localhost:3000`)                        |
| `PORT`               | Server port (default `3000`)                                                                                |
| `DOCKER_SOCKET_PATH` | Docker socket path (default `/var/run/docker.sock`)                                                         |
| `HOST_PROC_ROOT`     | Optional, **Linux Docker only**. Path to mounted host `/proc` (e.g. `/host/proc`) for host system metrics   |
| `HOST_SYS_ROOT`      | Optional, **Linux Docker only**. Path to mounted host `/sys` (e.g. `/host/sys`) for host network link speed |
| `HOST_ROOTFS`        | Optional, **Linux Docker only**. Path to mounted host root (e.g. `/rootfs`) for host disk usage             |

## Real-time updates

Socket.IO pushes `apps:status` (60s), `docker:containers` (15s), `system:stats` (2s), and `settings:updated` events. The client uses custom cache hooks with localStorage hydration and stale/fresh UI indicators.

**System metrics** reflect the host when Peek runs directly on the OS. In Docker, they reflect the container by default; on **Linux only**, optional host mounts can expose real host stats (see [System metrics — platform support](#system-metrics--platform-support)). Admins can show or hide the system info panel from Settings.
