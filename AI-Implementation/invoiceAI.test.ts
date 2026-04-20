import { describe, expect, test, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import pool from '../AWS/datastore';
import { authLogin, authRegister } from '../AWS/auth/auth';

jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn().mockImplementation(() =>
    Promise.resolve({
      content: [{ type: 'text', text: JSON.stringify({
        customer: {
          id: 'CUST-001',
          fullName: 'Sarah Johnson',
          email: 'sarah@horizondigital.com',
          phone: '0412345678',
          billingAddress: {
            street: '88 Pacific Highway',
            city: 'North Sydney',
            postcode: '2060',
            country: 'AU'
          },
          shippingAddress: {
            street: '88 Pacific Highway',
            city: 'North Sydney',
            postcode: '2060',
            country: 'AU'
          }
        },
        lineItems: [
          {
            description: 'Cloud Infrastructure Consulting',
            quantity: 10,
            rate: 250
          }
        ],
        currency: 'AUD',
        tax: {
          taxId: 'GST',
          countryCode: 'AU',
          taxPercentage: 10
        },
        from: {
          businessName: 'Apex Tech Solutions',
          address: {
            street: '88 Collins Street',
            city: 'Melbourne',
            postcode: '3000',
            country: 'AU'
          },
          taxId: 'ABN12345678',
          abnNumber: '12345678',
          dueDate: '2026-06-30'
        }
      })}]
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

describe('POST /v1/ai/invoice/generate', () => {
  test('Standard user can generate an invoice', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/generate')
      .set('token', token)
      .send({ description: 'Create an invoice for Sarah Johnson for 10 hours of cloud consulting at $250 per hour' });
    expect(res.statusCode).toStrictEqual(201);
    expect(res.body.message).toBe('Invoice generated successfully.');
    expect(res.body.invoiceId).toBeDefined();
    expect(res.body.invoiceData).toBeDefined();
  });

  test('Pro user can generate an invoice', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/generate')
      .set('token', proToken)
      .send({ description: 'Create an invoice for Sarah Johnson for 10 hours of cloud consulting at $250 per hour' });
    expect(res.statusCode).toStrictEqual(201);
    expect(res.body.invoiceId).toBeDefined();
  });

  test('Invoice is saved to database', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/generate')
      .set('token', token)
      .send({ description: 'Create an invoice for Sarah Johnson for 10 hours of cloud consulting at $250 per hour' });
    
    const result = await pool.query(
      `SELECT * FROM invoices WHERE invoiceId = $1`,
      [res.body.invoiceId]
    );
    expect(result.rows.length).toStrictEqual(1);
    expect(result.rows[0].status).toBe('Generated');
  });

  test('Missing description returns 400', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/generate')
      .set('token', token)
      .send({});
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('No token returns 401', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/generate')
      .send({ description: 'Create an invoice for Sarah Johnson' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invalid token returns 401', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/generate')
      .set('token', 'invalidtoken')
      .send({ description: 'Create an invoice for Sarah Johnson' });
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
      .post('/v1/ai/invoice/generate')
      .set('token', token)
      .send({ description: 'Create an invoice for Sarah Johnson' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(429);
  });

  test('User not found returns 404', async () => {
    const decoded = require('jsonwebtoken').decode(token) as { userId: string };
    await pool.query(`DELETE FROM users WHERE userId = $1`, [decoded.userId]);
    const res = await request(app)
      .post('/v1/ai/invoice/generate')
      .set('token', token)
      .send({ description: 'Create an invoice for Sarah Johnson' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(404);
  });
});

describe('POST /v1/ai/invoice/autofill', () => {
  test('Pro user can autofill invoice fields', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/autofill')
      .set('token', proToken)
      .send({ description: 'Create an invoice for Sarah Johnson for 10 hours of cloud consulting at $250 per hour' });
    expect(res.statusCode).toStrictEqual(200);
    expect(res.body.message).toBe('Invoice fields generated successfully. Please review and submit.');
    expect(res.body.invoiceData).toBeDefined();
  });

  test('Invoice is not saved to database for autofill', async () => {
    await request(app)
      .post('/v1/ai/invoice/autofill')
      .set('token', proToken)
      .send({ description: 'Create an invoice for Sarah Johnson' });

    const result = await pool.query(`SELECT * FROM invoices`);
    expect(result.rows.length).toStrictEqual(0);
  });

  test('Standard user cannot use autofill', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/autofill')
      .set('token', token)
      .send({ description: 'Create an invoice for Sarah Johnson' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(403);
  });

  test('Missing description returns 400', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/autofill')
      .set('token', proToken)
      .send({});
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('No token returns 401', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/autofill')
      .send({ description: 'Create an invoice for Sarah Johnson' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invalid token returns 401', async () => {
    const res = await request(app)
      .post('/v1/ai/invoice/autofill')
      .set('token', 'invalidtoken')
      .send({ description: 'Create an invoice for Sarah Johnson' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('User not found returns 404', async () => {
    const decoded = require('jsonwebtoken').decode(proToken) as { userId: string };
    await pool.query(`DELETE FROM users WHERE userId = $1`, [decoded.userId]);
    const res = await request(app)
      .post('/v1/ai/invoice/autofill')
      .set('token', proToken)
      .send({ description: 'Create an invoice for Sarah Johnson' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(404);
  });
});

describe('POST /v1/ai/invoice/update/:id', () => {
  let invoiceId: string;

  beforeEach(async () => {
    // Create an invoice to update
    const decoded = require('jsonwebtoken').decode(proToken) as { userId: string };
    const result = await pool.query(
      `INSERT INTO invoices (invoiceId, userId, invoiceXML, invoiceData, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING invoiceId`,
      [
        require('uuid').v4(),
        decoded.userId,
        '<Invoice></Invoice>',
        JSON.stringify({
          customer: { fullName: 'Sarah Johnson', email: 'sarah@test.com', phone: '0412345678',
            billingAddress: { street: '88 Pacific Highway', city: 'North Sydney', postcode: '2060', country: 'AU' },
            shippingAddress: { street: '88 Pacific Highway', city: 'North Sydney', postcode: '2060', country: 'AU' }
          },
          lineItems: [{ description: 'Consulting', quantity: 10, rate: 250 }],
          currency: 'AUD',
          tax: { taxId: 'GST', countryCode: 'AU', taxPercentage: 10 },
          from: { businessName: 'Apex Tech', address: { street: '88 Collins St', city: 'Melbourne', postcode: '3000', country: 'AU' },
            taxId: 'ABN123', abnNumber: '123', dueDate: new Date('2026-06-30')
          }
        }),
        'Generated'
      ]
    );
    invoiceId = result.rows[0].invoiceid;
  });

  test('Pro user can update invoice with AI', async () => {
    const res = await request(app)
      .post(`/v1/ai/invoice/update/${invoiceId}`)
      .set('token', proToken)
      .send({ description: 'Change the customer name to Jane Smith' });
    expect(res.statusCode).toStrictEqual(200);
    expect(res.body.message).toBe('Invoice fields updated successfully. Please review and submit.');
    expect(res.body.invoiceData).toBeDefined();
  });

  test('Standard user cannot use AI invoice update', async () => {
    const res = await request(app)
      .post(`/v1/ai/invoice/update/${invoiceId}`)
      .set('token', token)
      .send({ description: 'Change the customer name to Jane Smith' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(403);
  });

  test('Invoice not found returns 404', async () => {
    const res = await request(app)
      .post(`/v1/ai/invoice/update/00000000-0000-0000-0000-000000000000`)
      .set('token', proToken)
      .send({ description: 'Change the customer name to Jane Smith' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(404);
  });

  test('Invoice belonging to another user returns 403', async () => {
    const res = await request(app)
      .post(`/v1/ai/invoice/update/${invoiceId}`)
      .set('token', token)
      .send({ description: 'Change the customer name to Jane Smith' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(403);
  });

  test('Finalised invoice returns 409', async () => {
    await pool.query(`UPDATE invoices SET status = 'Paid' WHERE invoiceId = $1`, [invoiceId]);
    const res = await request(app)
      .post(`/v1/ai/invoice/update/${invoiceId}`)
      .set('token', proToken)
      .send({ description: 'Change the customer name to Jane Smith' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(409);
  });

  test('Missing description returns 400', async () => {
    const res = await request(app)
      .post(`/v1/ai/invoice/update/${invoiceId}`)
      .set('token', proToken)
      .send({});
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('No token returns 401', async () => {
    const res = await request(app)
      .post(`/v1/ai/invoice/update/${invoiceId}`)
      .send({ description: 'Change the customer name to Jane Smith' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invalid token returns 401', async () => {
    const res = await request(app)
      .post(`/v1/ai/invoice/update/${invoiceId}`)
      .set('token', 'invalidtoken')
      .send({ description: 'Change the customer name to Jane Smith' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invoice belonging to another pro user returns 403', async () => {
    const otherEmail = `other-${Date.now()}@gmail.com`;
    await authRegister(otherEmail, 'correctpassword123');
    const otherLogin = await authLogin(otherEmail, 'correctpassword123');
    const otherDecoded = require('jsonwebtoken').decode(otherLogin.token) as { userId: string };
    await pool.query(`UPDATE users SET tier = 'pro' WHERE userId = $1`, [otherDecoded.userId]);

    const res = await request(app)
      .post(`/v1/ai/invoice/update/${invoiceId}`)
      .set('token', otherLogin.token)
      .send({ description: 'Change the customer name to Jane Smith' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(403);
  });
});