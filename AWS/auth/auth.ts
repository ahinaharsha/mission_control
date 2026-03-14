import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../datastore';
import { HttpError } from '../../class';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function authRegister(email: string, password: string): Promise<void> {
  if (!email || !password) {
    throw new HttpError('Email and password are required.', 400);
  }

  const existing = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    throw new HttpError('Email already in use.', 400);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = uuidv4();

  await pool.query(
    'INSERT INTO users (userId, email, password) VALUES ($1, $2, $3)',
    [userId, email, hashedPassword]
  );
}

export async function authLogin(email: string, password: string): Promise<{ token: string }> {
  if (!email || !password) {
    throw new HttpError('Email and password are required.', 400);
  }

  // Fetch user from database
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new HttpError('Invalid email or password.', 401);
  }

  const user = result.rows[0];

  // Compare password with hashed password
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new HttpError('Invalid email or password.', 401);
  }

  // Generate token
  const token = jwt.sign({ userId: user.userid }, JWT_SECRET, { expiresIn: '24h' });

  // Store token in database
  await pool.query(
    'UPDATE users SET token = $1 WHERE userId = $2',
    [token, user.userid]
  );

  return { token };
}

export function authenticate(token: string | undefined): void {
  if (!token) {
    throw new HttpError('Not logged in.', 401);
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (e) {
    throw new HttpError('Invalid or expired token.', 401);
  }
}

export async function authLogout(token: string | undefined): Promise<void> {
  if (!token) {
    throw new HttpError('Not logged in.', 401);
  }

  await pool.query(
    'UPDATE users SET token = NULL WHERE token = $1',
    [token]
  );
}