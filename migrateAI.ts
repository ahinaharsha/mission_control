import pool from './AWS/datastore';

async function migrateAI() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(10) DEFAULT 'standard'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id UUID PRIMARY KEY,
        userId UUID REFERENCES users(userId),
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('AI migration successful!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await pool.end();
  }
}

migrateAI();