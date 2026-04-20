import { describe, expect, test, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import pool from '../AWS/datastore';
import { authLogin, authRegister } from '../AWS/auth/auth';
import { normalizeInvoiceInput } from './AIinvoicegeneration';

jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate }
  }));
  
  // Set default implementation
  mockCreate.mockImplementation((options: any) => {
    // Check the user message to determine response
    const userMessage = options.messages.find((msg: any) => msg.role === 'user')?.content || '';
    
    if (userMessage === 'Generate an invoice.') {
      // Insufficient information - return incomplete JSON that fails validation
      return Promise.resolve({
        content: [{ type: 'text', text: '{"customer":{"fullName":"John Doe"},"from":{"businessName":"Test Business"},"lineItems":[{"description":"Service","quantity":1,"rate":100}],"currency":"AUD"}' }]
      });
    } else {
      // Default successful response for other tests
      return Promise.resolve({
        content: [{ type: 'text', text: '{"customer":{"fullName":"John Doe","email":"john@example.com","phone":"1234567890","billingAddress":{"street":"123 Main St","city":"Sydney","postcode":"2000","country":"Australia"},"shippingAddress":{"street":"123 Main St","city":"Sydney","postcode":"2000","country":"Australia"}},"from":{"businessName":"Test Business","address":{"street":"456 Business Ave","city":"Melbourne","postcode":"3000","country":"Australia"},"taxId":"123456789","abnNumber":"987654321","dueDate":"2024-12-31"},"lineItems":[{"description":"Test service","quantity":1,"rate":100}],"currency":"AUD","tax":{"taxId":"AU123","countryCode":"AU","taxPercentage":10}}' }]
      });
    }
  });
  
  return {
    __esModule: true,
    default: MockAnthropic,
    mockCreate // Export for test access
  };
});

let token: string;
let proToken: string;

beforeEach(async () => {
  // Override database config for local testing
  process.env.DB_HOST = 'localhost';
  process.env.DB_NAME = 'mission_control';
  process.env.DB_USER = 'postgres';
  process.env.DB_PASSWORD = 'postgres';
  process.env.DB_PORT = '5432';

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

describe('POST /v1/ai/generate-invoice', () => {
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
        // Import the mock from the mocked module
        const { mockCreate } = require('@anthropic-ai/sdk');
        
        // Override the mock for this test to return invalid JSON
        mockCreate.mockImplementationOnce(() =>
            Promise.resolve({
                content: [{ type: 'text', text: 'This is an invalid response without JSON.' }]
            })
        );

        const res = await request(app)
            .post('/v1/ai/generate-invoice')
            .set('token', token)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(500);
        expect(res.body.error).toBe('AI returned invalid JSON.');
    });

    test('normalizeInvoiceInput throws invalid invoice payload for non-object raw values', () => {
        expect(() => normalizeInvoiceInput(null)).toThrow('AI returned an invalid invoice payload.');
    });

    test('AI returns explicit error payload', async () => {
        const { mockCreate } = require('@anthropic-ai/sdk');
        mockCreate.mockImplementationOnce(() =>
            Promise.resolve({
                content: [{ type: 'text', text: '{"error":"Need more required fields."}' }]
            })
        );

        const res = await request(app)
            .post('/v1/ai/generate-invoice')
            .set('token', token)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(400);
        expect(res.body.error).toBe('Insufficient information provided: Need more required fields.');
    });

    test('AI did not return a valid response', async () => {
        const { mockCreate } = require('@anthropic-ai/sdk');
        mockCreate.mockImplementationOnce(() =>
            Promise.resolve({
                content: [{ type: 'image', url: 'https://example.com/image.png' }]
            })
        );

        const res = await request(app)
            .post('/v1/ai/generate-invoice')
            .set('token', token)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(500);
        expect(res.body.error).toBe('AI did not return a valid response.');
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


describe('POST /v1/ai/invoices/autofill', () => {
    test('Successfully autofills invoice data', async () => {
        const res = await request(app)
            .post('/v1/ai/invoices/autofill')
            .set('token', proToken)
            .send({ description: 'Autofill invoice data for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(200);
        expect(res.body.draft).toStrictEqual(expect.any(Object));
        expect(res.body.message).toBe('Invoice draft generated successfully.');
    });

    test('Standard user cannot autofill invoice data', async () => {
        const res = await request(app)
            .post('/v1/ai/invoices/autofill')
            .set('token', token)
            .send({ description: 'Autofill invoice data for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(403);
        expect(res.body.error).toBe('Autofill is only available for Pro users.');
    });

    test('AI returns invalid JSON for autofill', async () => {
        const { mockCreate } = require('@anthropic-ai/sdk');
        mockCreate.mockImplementationOnce(() =>
            Promise.resolve({
                content: [{ type: 'text', text: 'This is an invalid response without JSON.' }]
            })
        );

        const res = await request(app)
            .post('/v1/ai/invoices/autofill')
            .set('token', proToken)
            .send({ description: 'Autofill invoice data for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        expect(res.statusCode).toStrictEqual(500);
        expect(res.body.error).toBe('AI returned invalid JSON.');
    });

});
    