#!/bin/bash
# start-neon.sh - Use Neon cloud database

echo "☁️  Starting with Neon Cloud Database..."

# Stop any running local postgres
docker compose stop postgres 2>/dev/null

# Start just the backend (no local postgres)
DB_HOST="ep-square-math-aolgqef5-pooler.c-2.ap-southeast-1.aws.neon.tech" \
DB_PORT="5432" \
DB_NAME="neondb" \
DB_USER="neondb_owner" \
DB_PASSWORD="npg_QNxEu7vRUgz8" \
SSLMODE="require" \
docker compose up backend