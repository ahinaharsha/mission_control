import Anthropic from '@anthropic-ai/sdk';
import pool from '../AWS/datastore';
import { HttpError } from '../class';
import { authenticate } from '../AWS/auth/auth';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STANDARD_MESSAGE_LIMIT = 25;

const SYSTEM_PROMPT = `You are an expert invoicing assistant for MC Invoicing, a Peppol UBL-compliant invoice management platform. 
You help users with:
- Understanding invoicing concepts and best practices
- Explaining Peppol UBL standards and compliance requirements
- Answering questions about GST, tax, and currency
- Guiding users through creating, updating, and managing invoices
- Australian invoicing regulations and requirements
Keep responses concise, professional, and relevant to invoicing.`;

async function getUserFromToken(token: string) {
  const decoded = jwt.decode(token) as { userId: string };
  const result = await pool.query(
    `SELECT userId, tier, message_count, last_reset_date FROM users WHERE userId = $1`,
    [decoded.userId]
  );
  if (result.rows.length === 0) {
    throw new HttpError('User not found.', 404);
  }
  return result.rows[0];
}

async function resetMessageCountIfNeeded(userId: string) {
  const result = await pool.query(
    `UPDATE users SET message_count = 0, last_reset_date = CURRENT_DATE 
     WHERE userId = $1 AND last_reset_date < CURRENT_DATE
     RETURNING message_count`,
    [userId]
  );
  return result.rows.length > 0 ? 0 : null;
}

async function getChatHistory(userId: string) {
  const result = await pool.query(
    `SELECT role, content FROM chat_history WHERE userId = $1 ORDER BY createdAt ASC`,
    [userId]
  );
  return result.rows.map(row => ({
    role: row.role as 'user' | 'assistant',
    content: row.content
  }));
}

async function saveChatHistory(userId: string, role: string, content: string) {
  await pool.query(
    `INSERT INTO chat_history (id, userId, role, content) VALUES ($1, $2, $3, $4)`,
    [uuidv4(), userId, role, content]
  );
}

export async function chat(token: string | undefined, message: string) {
  authenticate(token);

  const user = await getUserFromToken(token as string);
  const userId = user.userid;
  const tier = user.tier;

  const resetCount = await resetMessageCountIfNeeded(userId);
  const currentCount = resetCount !== null ? resetCount : user.message_count;

  if (tier === 'standard' && currentCount >= STANDARD_MESSAGE_LIMIT) {
    throw new HttpError('Daily message limit reached. Upgrade to Pro for unlimited messages.', 429);
  }

  const history = tier === 'pro' ? await getChatHistory(userId) : [];

  const messages = [...history, { role: 'user' as const, content: message }];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages
  });

  const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

  if (tier === 'pro') {
    await saveChatHistory(userId, 'user', message);
    await saveChatHistory(userId, 'assistant', assistantMessage);
  }

  if (tier === 'standard') {
    await pool.query(
      `UPDATE users SET message_count = message_count + 1 WHERE userId = $1`,
      [userId]
    );
  }

  return {
    message: assistantMessage,
    tier,
    messagesRemaining: tier === 'standard' ? STANDARD_MESSAGE_LIMIT - currentCount - 1 : null
  };
}

export async function clearChatHistory(token: string | undefined) {
  authenticate(token);
  const user = await getUserFromToken(token as string);

  if (user.tier !== 'pro') {
    throw new HttpError('Chat history is only available for Pro users.', 403);
  }

  await pool.query(`DELETE FROM chat_history WHERE userId = $1`, [user.userid]);
  return { message: 'Chat history cleared.' };
}