import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://awcrm_user:awcrm_password@localhost:5432/awcrm_dev',
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE, 10) || 20,
  timeout: parseInt(process.env.DATABASE_TIMEOUT, 10) || 30000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}));