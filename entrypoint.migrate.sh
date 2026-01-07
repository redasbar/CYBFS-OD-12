#!/bin/sh
set -e

echo "Waiting for the database ..."
until pg_isready -h db -U postgres; do
  sleep 2
done

echo "Running database migrations..."
flask db upgrade

echo "Migrations completed."
