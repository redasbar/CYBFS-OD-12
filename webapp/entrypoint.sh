#!/bin/sh
set -e

echo "Waiting for the database to be ready..."
sleep 5

# Ensure migrations folder exists and has correct ownership
mkdir -p /app/migrations
chown -R flaskuser:flaskuser /app/migrations

# Initialize migrations only if env.py is missing
#if [ ! -f "/app/migrations/env.py" ]; then
#    echo "Initializing Flask-Migrate..."
#    flask db init
#fi

# Generate migration if there are model changes
#echo "Checking for migrations..."
#flask db migrate -m "Auto migration" || echo "No changes to migrate"

# Only initialize if folder does NOT exist
#if [ ! -d "/app/migrations" ]; then
#    echo "Initializing Flask-Migrate..."
#    flask db init
#    flask db migrate -m "Initial migration"
#else
#    echo "Migrations folder already exists, skipping init."
#fi

# Check if migrations folder exists and env.py is there
if [ ! -f "/app/migrations/env.py" ]; then
    echo "Initializing Flask-Migrate..."
    flask db init
    flask db migrate -m "Initial migration"
else
    echo "Migrations folder is ready, skipping init."
fi

# Apply pending migrations
echo "Applying database migrations..."
flask db upgrade

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn --workers 3 --bind 0.0.0.0:8000 wsgi:app
