# peek

Ultra-minimal dashboard for NAS or self-hosted servers. Welcome header with date, time, and weather; user-managed app shortcuts with health pings; Docker container list with restart and pause/start controls.

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

With Docker:

```bash
docker compose up -d db
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

```bash
docker compose up -d --build
```

The `peek` service mounts `/var/run/docker.sock` read-only for container controls. Ensure the container user can access the socket (add to the `docker` group or run with appropriate permissions).

Set these in `.env` or compose environment:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `BETTER_AUTH_URL` | Public URL of the app |
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

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Apply migrations |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |

## Fonts

- **Poppins** — greeting
- **Inter** — body text
- **Inconsolata** — labels, timestamps, console UI elements
