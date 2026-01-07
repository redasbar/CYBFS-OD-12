#!/bin/sh
set -e

echo "Waiting for the database to be ready..."
until pg_isready -h db -U "$DB_USER"; do
  sleep 2
done

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn --workers 3 --bind 0.0.0.0:8000 wsgi:app
