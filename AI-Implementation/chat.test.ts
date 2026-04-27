import { describe, expect, test, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import pool from '../AWS/datastore';
import { authLogin, authRegister } from '../AWS/auth/auth';

jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn().mockImplementation(() =>
    Promise.resolve({
      content: [{ type: 'text', text: 'This is a mocked AI response.' }]
    })
  );
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate }
  }));
  return {
    __esModule: true,
    default: MockAnthropic
  };
});

let token: string;
let proToken: string;

beforeEach(async () => {
  await pool.query('DELETE FROM chat_history');
  await pool.query('DELETE FROM invoices');
  await pool.query('DELETE FROM users');

  const testEmail = `test-${Date.now()}@gmail.com`;
  await authRegister(testEmail, 'correctpassword123');
  const loginRes = await authLogin(testEmail, 'correctpassword123');
  token = loginRes.token;

  const proEmail = `pro-${Date.now()}@gmail.com`;
  await authRegister(proEmail, 'correctpassword123');
  const proLoginRes = await authLogin(proEmail, 'correctpassword123');
  proToken = proLoginRes.token;

  const proDecoded = require('jsonwebtoken').decode(proToken) as { userId: string };
  await pool.query(
    `UPDATE users SET tier = 'pro' WHERE userId = $1`,
    [proDecoded.userId]
  );
}, 30000);

afterAll(async () => {
  await pool.end();
}, 30000);

describe('POST /v1/ai/chat', () => {
  test('Standard user can send a message and receive a response', async () => {
    const res = await request(app)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'What is a Peppol invoice?' });
    expect(res.statusCode).toStrictEqual(200);
    expect(res.body.message).toStrictEqual(expect.any(String));
    expect(res.body.tier).toBe('standard');
    expect(res.body.messagesRemaining).toStrictEqual(expect.any(Number));
  });

  test('Pro user can send a message and receive a response', async () => {
    const res = await request(app)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${proToken}`)
      .send({ message: 'How do I create an invoice?' });
    expect(res.statusCode).toStrictEqual(200);
    expect(res.body.message).toStrictEqual(expect.any(String));
    expect(res.body.tier).toBe('pro');
    expect(res.body.messagesRemaining).toBeNull();
  });

  test('Pro user chat history is stored', async () => {
    await request(app)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${proToken}`)
      .send({ message: 'What is GST?' });

    const decoded = require('jsonwebtoken').decode(proToken) as { userId: string };
    const result = await pool.query(
      `SELECT * FROM chat_history WHERE userId = $1`,
      [decoded.userId]
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  test('Standard user chat history is not stored', async () => {
    await request(app)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'What is GST?' });

    const decoded = require('jsonwebtoken').decode(token) as { userId: string };
    const result = await pool.query(
      `SELECT * FROM chat_history WHERE userId = $1`,
      [decoded.userId]
    );
    expect(result.rows.length).toStrictEqual(0);
  });

  test('Missing message', async () => {
    const res = await request(app)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('No token', async () => {
    const res = await request(app)
      .post('/v1/ai/chat')
      .send({ message: 'What is GST?' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invalid token', async () => {
    const res = await request(app)
      .post('/v1/ai/chat')
      .set('Authorization', 'Bearer invalidtoken')
      .send({ message: 'What is GST?' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Standard user message limit is enforced', async () => {
    const decoded = require('jsonwebtoken').decode(token) as { userId: string };
    await pool.query(
      `UPDATE users SET message_count = 25, last_reset_date = CURRENT_DATE WHERE userId = $1`,
      [decoded.userId]
    );
    const res = await request(app)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'What is GST?' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(429);
  });

  test('User not found', async () => {
    const decoded = require('jsonwebtoken').decode(token) as { userId: string };
    await pool.query(`DELETE FROM users WHERE userId = $1`, [decoded.userId]);
    const res = await request(app)
        .post('/v1/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'What is GST?' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(404);
  });
});

describe('DELETE /v1/ai/chat/history', () => {
  test('Pro user can clear chat history', async () => {
    await request(app)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${proToken}`)
      .send({ message: 'What is GST?' });

    const res = await request(app)
      .delete('/v1/ai/chat/history')
      .set('Authorization', `Bearer ${proToken}`);
    expect(res.statusCode).toStrictEqual(200);
    expect(res.body).toStrictEqual({ message: expect.any(String) });

    const decoded = require('jsonwebtoken').decode(proToken) as { userId: string };
    const result = await pool.query(
      `SELECT * FROM chat_history WHERE userId = $1`,
      [decoded.userId]
    );
    expect(result.rows.length).toStrictEqual(0);
  });

  test('Standard user cannot clear chat history', async () => {
    const res = await request(app)
      .delete('/v1/ai/chat/history')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(403);
  });

  test('No token', async () => {
    const res = await request(app)
      .delete('/v1/ai/chat/history');
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });
});