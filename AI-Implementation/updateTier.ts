import pool from '../AWS/datastore';
import { HttpError } from '../class';
import { authenticate } from '../AWS/auth/auth';
import jwt from 'jsonwebtoken';

const VALID_TIERS = ['standard', 'pro'];

export async function updateTier(token: string | undefined, tier: string) {
  authenticate(token);

  if (!VALID_TIERS.includes(tier)) {
    throw new HttpError('Invalid tier. Must be standard or pro.', 400);
  }

  const decoded = jwt.decode(token as string) as { userId: string };
  const userId = decoded.userId;

  const result = await pool.query(
    `UPDATE users SET tier = $1 WHERE userId = $2 RETURNING tier`,
    [tier, userId]
  );

  if (result.rows.length === 0) {
    throw new HttpError('User not found.', 404);
  }

  return { message: `Tier updated to ${tier} successfully.`, tier };
}