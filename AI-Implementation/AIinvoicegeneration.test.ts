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

describe('POST /V1/ai/generate-invoice', () => {
    test('Standard user can generate an invoice', async () => {
        const res = await request(app)
            .post('/v1/ai/generate-invoice')
            .set('token', token)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(200);
        expect(res.body.invoice).toStrictEqual(expect.any(Object));
    });

    test('Pro user can generate an invoice', async () => {
        const res = await request(app)
            .post('/v1/ai/generate-invoice')
            .set('token', proToken)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(200);
        expect(res.body.invoice).toStrictEqual(expect.any(Object));
    });

    test('AI returns invalid JSON', async () => {
        const mockCreate = jest.fn().mockImplementation(() =>
            Promise.resolve({
                content: [{ type: 'text', text: 'This is an invalid response without JSON.' }]
            })
        );
        const MockAnthropic = jest.fn().mockImplementation(() => ({
            messages: { create: mockCreate }
        }));
        jest.mock('@anthropic-ai/sdk', () => ({
            __esModule: true,
            default: MockAnthropic
        }));

        const res = await request(app)
            .post('/v1/ai/generate-invoice')
            .set('token', token)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(500);
        expect(res.body.error).toBe('AI returned invalid JSON.');

    });

    test('User provides insufficient information', async () => {
        const res = await request(app)
            .post('/v1/ai/generate-invoice')
            .set('token', token)
            .send({ description: 'Generate an invoice.' });
        expect(res.statusCode).toStrictEqual(400);
        expect(res.body.error).toMatch(`AI could not generate a complete invoice. Please provide more details`);
    });
    
});
    