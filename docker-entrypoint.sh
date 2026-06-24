#!/bin/sh
set -e

echo "Running database migrations..."
bun run db:generate
bun run db:migrate

echo "Starting server..."
exec node server.js
