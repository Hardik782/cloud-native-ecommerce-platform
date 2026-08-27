#!/bin/bash
set -e

echo "========================================="
echo "  FASHION STORE DATABASE INITIALIZATION"
echo "========================================="

# Function to create database
create_database() {
    local db_name=$1
    echo "Creating database: $db_name"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE DATABASE $db_name;
        GRANT ALL PRIVILEGES ON DATABASE $db_name TO $POSTGRES_USER;
EOSQL
}

# Create additional databases
create_database auth_db
create_database products_db
create_database orders_db
create_database users_db

echo "✅ All databases created successfully!"
echo "   - auth_db"
echo "   - products_db"
echo "   - orders_db"
echo "   - users_db"