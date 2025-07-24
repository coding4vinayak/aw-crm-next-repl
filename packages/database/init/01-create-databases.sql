-- Create development database
CREATE DATABASE awcrm_dev;

-- Create test database
CREATE DATABASE awcrm_test;

-- Create user for application
CREATE USER awcrm_user WITH PASSWORD 'awcrm_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE awcrm_dev TO awcrm_user;
GRANT ALL PRIVILEGES ON DATABASE awcrm_test TO awcrm_user;

-- Connect to development database and create extensions
\c awcrm_dev;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Connect to test database and create extensions
\c awcrm_test;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";