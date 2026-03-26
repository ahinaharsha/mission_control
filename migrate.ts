import pool from './AWS/datastore';

async function migrate() {
  try {
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoiceData JSONB`);
    console.log('Migration successful!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await pool.end();
  }
}

migrate();