#!/bin/sh
set -e

echo "Waiting for the database to be ready..."
until pg_isready -h db -U "$DB_USER"; do
  sleep 2
done

# echo "Applying database migrations..."
# export MIGRATION_DATABASE_URL="postgresql://miguser:Sdlgih865qfkjdmqDoOàSf84Fzse1Li8@db:5432/LibraTech_db"
# flask db upgrade
# unset MIGRATION_DATABASE_URL

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn --workers 3 --bind 0.0.0.0:8000 wsgi:app
