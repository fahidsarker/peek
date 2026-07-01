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
    build: .
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
docker compose up -d --build
```

## Environment variables

| Variable             | Description                                                                          |
| -------------------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`       | Postgres connection string                                                           |
| `SESSION_SECRET`     | Secret for cookie signing                                                            |
| `APP_URL`            | Client origin for CORS (dev: `http://localhost:5173`, prod: `http://localhost:3000`) |
| `PORT`               | Server port (default `3000`)                                                         |
| `DOCKER_SOCKET_PATH` | Docker socket path (default `/var/run/docker.sock`)                                  |

## Real-time updates

Socket.IO pushes `apps:status` (60s), `docker:containers` (15s), `system:stats` (2s), and `settings:updated` events. The client uses custom cache hooks with localStorage hydration and stale/fresh UI indicators.

**System metrics** reflect the host machine running the Peek server (macOS, Windows, or Linux). Admins can show or hide the system info panel from Settings.
