#!/bin/sh

echo "⏳ Waiting for PostgreSQL..."
while ! nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  sleep 0.5
done
echo "✅ PostgreSQL is ready!"

echo "📦 Running migrations..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

echo "🚀 Starting server..."
exec "$@"