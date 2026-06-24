<p align="center">
  <img src="https://github.com/fahidsarker/peek/blob/main/assets/banner.png" alt="peek — ultra-minimal NAS dashboard" width="100%" />
</p>

<p align="center">
  Ultra-minimal dashboard for NAS or self-hosted servers.<br />
  Welcome header with date, time, and weather; user-managed app shortcuts with health pings; Docker container list with restart and pause/start controls.
</p>

---

## Stack

- Next.js 16 (App Router)
- Postgres + Drizzle ORM
- Better Auth (email/password)
- dockerode (Docker socket)
- Tailwind CSS v4

## Quick start

### 1. Environment

```bash
cp .env.example .env
```

Set `BETTER_AUTH_SECRET` to a long random string and adjust `DATABASE_URL` if needed.

### 2. Database

Start Postgres (or use the full stack in [Docker deployment](#docker-deployment)):

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
bun run db:migrate
```

Or push schema directly during development:

```bash
bun run db:push
```

### 3. Development

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The **first user to sign up becomes admin** with Docker access enabled.

## Docker deployment

Create a `docker-compose.yml` in the project root:

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
    user: "${UID:-1001}:${GID:-1001}"
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://peek:peek@db:5432/peek
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET:-change-me-to-a-long-random-string}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL:-http://localhost:3000}
      DOCKER_SOCKET_PATH: /var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      db:
        condition: service_healthy

volumes:
  peek_pg_data:
```

Then build and start:

```bash
docker compose up -d --build
```

On startup, the `peek` container runs `db:generate` and `db:migrate` before starting the app.

Set `UID` and `GID` in your shell or `.env` if you need the container process to match a host user (defaults to `1001:1001`). The `drizzle` directory is world-writable so migrations can run under any UID.

The `peek` service mounts `/var/run/docker.sock` read-only for container controls. Ensure the container user can access the socket (add to the `docker` group or run with appropriate permissions).

Set these in `.env` or compose environment:

| Variable             | Description                                         |
| -------------------- | --------------------------------------------------- |
| `DATABASE_URL`       | Postgres connection string                          |
| `BETTER_AUTH_SECRET` | Session signing secret                              |
| `BETTER_AUTH_URL`    | Public URL of the app                               |
| `DOCKER_SOCKET_PATH` | Docker socket path (default `/var/run/docker.sock`) |

## Features

### Dashboard

- Greeting, live clock, weather widget
- **Apps** — click to open public URL; status dot from cached ping (refreshes when viewing, max once per minute)
- **Docker** — visible only for users with Docker permission; restart and pause/start controls

### Admin panel (`/admin`)

- **Apps** — add/remove shortcuts (icon URL, title, public URL, optional ping URL)
- **Users** — delete, toggle admin, toggle Docker visibility/controls
- **Settings** — allow signups, weather provider (Open-Meteo or OpenWeatherMap), location, API key

### Weather

- **Open-Meteo** (default, no API key) when lat/lon are set in admin
- **OpenWeatherMap** when provider is set to OpenWeather and an API key is configured

## Scripts

| Command               | Description                 |
| --------------------- | --------------------------- |
| `bun run dev`         | Start dev server            |
| `bun run build`       | Production build            |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate`  | Apply migrations            |
| `bun run db:push`     | Push schema to database     |
| `bun run db:studio`   | Open Drizzle Studio         |

## Fonts

- **Poppins** — greeting
- **Inter** — body text
- **Inconsolata** — labels, timestamps, console UI elements
