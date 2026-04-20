import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use local database for testing
const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

const pool = new Pool({
  host: isTest ? 'localhost' : (process.env.DB_HOST || 'localhost'),
  port: parseInt(isTest ? '5432' : (process.env.DB_PORT || '5432')),
  database: isTest ? 'mission_control' : (process.env.DB_NAME || 'mission_control'),
  user: isTest ? 'postgres' : (process.env.DB_USER || 'postgres'),
  password: isTest ? 'postgres' : (process.env.DB_PASSWORD || 'postgres'),
  ssl: false
});

export default pool;