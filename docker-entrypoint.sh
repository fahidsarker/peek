#!/bin/sh
set -e

echo "Running database migrations..."
cd /app
bun run db:migrate

echo "Starting server..."
exec bun run apps/server/src/index.ts
