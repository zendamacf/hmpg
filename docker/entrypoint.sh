#!/bin/sh
set -eu

echo "Running database migrations..."
npx drizzle-kit migrate

echo "Starting server..."
exec node build/index.js
