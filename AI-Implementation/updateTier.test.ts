import { describe, expect, test, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import pool from '../AWS/datastore';
import { authLogin, authRegister } from '../AWS/auth/auth';

let token: string;

beforeEach(async () => {
  await pool.query('DELETE FROM chat_history');
  await pool.query('DELETE FROM invoices');
  await pool.query('DELETE FROM users');

  const testEmail = `test-${Date.now()}@gmail.com`;
  await authRegister(testEmail, 'correctpassword123');
  const loginRes = await authLogin(testEmail, 'correctpassword123');
  token = loginRes.token;
}, 30000);

afterAll(async () => {
  await pool.end();
}, 30000);

describe('PUT /v1/users/tier', () => {
  test('Successfully upgrades user to pro', async () => {
    const res = await request(app)
      .put('/v1/users/tier')
      .set('token', token)
      .send({ tier: 'pro' });
    expect(res.statusCode).toStrictEqual(200);
    expect(res.body.message).toStrictEqual(expect.any(String));
    expect(res.body.tier).toBe('pro');
  });

  test('Successfully downgrades user to standard', async () => {
    await request(app)
      .put('/v1/users/tier')
      .set('token', token)
      .send({ tier: 'pro' });
    const res = await request(app)
      .put('/v1/users/tier')
      .set('token', token)
      .send({ tier: 'standard' });
    expect(res.statusCode).toStrictEqual(200);
    expect(res.body.tier).toBe('standard');
  });

  test('Invalid tier returns 400', async () => {
    const res = await request(app)
      .put('/v1/users/tier')
      .set('token', token)
      .send({ tier: 'enterprise' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('Missing tier returns 400', async () => {
    const res = await request(app)
      .put('/v1/users/tier')
      .set('token', token)
      .send({});
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('No token returns 401', async () => {
    const res = await request(app)
      .put('/v1/users/tier')
      .send({ tier: 'pro' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invalid token returns 401', async () => {
    const res = await request(app)
      .put('/v1/users/tier')
      .set('token', 'invalidtoken')
      .send({ tier: 'pro' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Tier is actually updated in database', async () => {
    await request(app)
      .put('/v1/users/tier')
      .set('token', token)
      .send({ tier: 'pro' });

    const decoded = require('jsonwebtoken').decode(token) as { userId: string };
    const result = await pool.query(
      `SELECT tier FROM users WHERE userId = $1`,
      [decoded.userId]
    );
    expect(result.rows[0].tier).toBe('pro');
  });

  test('User not found returns 404', async () => {
    const decoded = require('jsonwebtoken').decode(token) as { userId: string };
    await pool.query(`DELETE FROM users WHERE userId = $1`, [decoded.userId]);
    const res = await request(app)
      .put('/v1/users/tier')
      .set('token', token)
      .send({ tier: 'pro' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(404);
  });
});