-- Initialize PostgreSQL database for AW CRM
-- This script runs when the PostgreSQL container starts for the first time

-- Create additional databases for testing
CREATE DATABASE awcrm_test;
CREATE DATABASE awcrm_staging;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE awcrm_dev TO awcrm_user;
GRANT ALL PRIVILEGES ON DATABASE awcrm_test TO awcrm_user;
GRANT ALL PRIVILEGES ON DATABASE awcrm_staging TO awcrm_user;

-- Enable required extensions
\c awcrm_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

\c awcrm_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

\c awcrm_staging;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create read-only user for analytics
CREATE USER awcrm_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE awcrm_dev TO awcrm_readonly;
GRANT USAGE ON SCHEMA public TO awcrm_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO awcrm_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO awcrm_readonly;