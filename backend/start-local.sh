#!/bin/bash
# start-local.sh - Use local PostgreSQL

echo "💻 Starting with Local Database..."

# Start both postgres and backend
docker compose --profile local up