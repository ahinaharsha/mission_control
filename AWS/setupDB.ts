import pool from './datastore';

async function setupDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        userId UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        token VARCHAR(255),
        tier VARCHAR(10) DEFAULT 'standard',
        message_count INTEGER DEFAULT 0,
        last_reset_date DATE DEFAULT CURRENT_DATE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        invoiceId UUID PRIMARY KEY,
        userId UUID REFERENCES users(userId),
        invoiceXML TEXT NOT NULL,
        invoiceData JSONB,
        status VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id UUID PRIMARY KEY,
        userId UUID REFERENCES users(userId),
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully!');
  } catch (e) {
    console.error('Error creating tables:', e);
  } finally {
    await pool.end();
  }
}

setupDb();