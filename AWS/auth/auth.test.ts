import request from 'sync-request-curl';
import pool from '../datastore'
import { HttpError } from '../../class';
import { authRegister, authLogin, authLogout, authenticate } from './auth';
import { describe, expect, test, afterAll, beforeEach } from '@jest/globals';
const SERVER_URL = 'http://localhost:3000';

beforeEach(async () => {
  await pool.query('DELETE FROM invoices');
  await pool.query('DELETE FROM users');
}, 30000);

afterAll(async () => {
  await pool.end();
}, 30000);

describe('POST /auth/register', () => {
  test('Successful registration', () => {
    const result = request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    expect(result.statusCode).toStrictEqual(201);
  });

  test('Missing email', () => {
    const result = request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: '', password: 'correctpassword123' }
    });
    const body = JSON.parse(result.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('Missing password', () => {
    const result = request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: 'test@gmail.com', password: '' }
    });
    const body = JSON.parse(result.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('Email already in use', () => {
    request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    const result = request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    const body = JSON.parse(result.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(400);
  });
  test('Registered user is stored in database', async () => {
    request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['test@gmail.com']
    );
    expect(result.rows.length).toStrictEqual(1);
    expect(result.rows[0].email).toStrictEqual('test@gmail.com');
  });

  test('missing email throws HttpError', async () => {
    expect(authRegister('', 'password123')).rejects.toThrow(HttpError);
  });

  test('missing password throws HttpError', async () => {
    expect(authRegister('test@gmail.com', '')).rejects.toThrow(HttpError);
  });
});

describe('authRegister direct', () => {
  test('Email already in use throws HttpError', async () => {
    await authRegister('direct@gmail.com', 'password123');
    await expect(authRegister('direct@gmail.com', 'password123')).rejects.toBeInstanceOf(HttpError);
  });
});

describe('POST /auth/login', () => {
  test('Correct login info', () => {
    request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    const result = request('POST', `${SERVER_URL}/auth/login`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    const body = JSON.parse(result.body.toString());
    expect(body).toStrictEqual({ token: expect.any(String) });
    expect(result.statusCode).toStrictEqual(200);
  });

  test('Email does not exist', () => {
    const result = request('POST', `${SERVER_URL}/auth/login`, {
      json: { email: 'wrong@gmail.com', password: 'correctpassword123' }
    });
    const body = JSON.parse(result.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });

  test('Password is incorrect', () => {
    request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    const result = request('POST', `${SERVER_URL}/auth/login`, {
      json: { email: 'test@gmail.com', password: 'wrongpassword123' }
    });
    const body = JSON.parse(result.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });

  test('Missing email', () => {
    const result = request('POST', `${SERVER_URL}/auth/login`, {
      json: { email: '', password: 'correctpassword123' }
    });
    const body = JSON.parse(result.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('missing email throws HttpError', async () => {
    expect(authLogin('', 'password123')).rejects.toThrow(HttpError);
  });

  test('missing password throws HttpError', async () => {
    expect(authLogin('test@gmail.com', '')).rejects.toThrow(HttpError);
  });
});

describe('authLogin direct', () => {
  test('Wrong password throws HttpError', async () => {
    await authRegister('direct2@gmail.com', 'password123');
    await expect(authLogin('direct2@gmail.com', 'wrongpassword')).rejects.toBeInstanceOf(HttpError);
  });

  test('Email does not exist throws HttpError', async () => {
    await expect(authLogin('nonexistent@gmail.com', 'password123')).rejects.toBeInstanceOf(HttpError);
  });
});

describe('POST /auth/logout', () => {
  test('Successful logout', () => {
    request('POST', `${SERVER_URL}/auth/register`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    const loginResult = request('POST', `${SERVER_URL}/auth/login`, {
      json: { email: 'test@gmail.com', password: 'correctpassword123' }
    });
    const { token } = JSON.parse(loginResult.body.toString());
    const result = request('POST', `${SERVER_URL}/auth/logout`, {
      headers: { token }
    });
    expect(result.statusCode).toStrictEqual(200);
  });

  test('No token provided', () => {
    const result = request('POST', `${SERVER_URL}/auth/logout`, {});
    const body = JSON.parse(result.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });

  test('missing token throws HttpError', async () => {
    expect(authLogout(undefined)).rejects.toThrow(HttpError);
  });
});

describe('authenticate function', () => {
  test('No token throws 401', () => {
    expect(() => authenticate(undefined)).toThrow(HttpError);
  });

  test('Invalid token throws 401', () => {
    expect(() => authenticate('invalidtoken123')).toThrow(HttpError);
  });

  test('Successful logout direct', async () => {
    await authRegister('logout@gmail.com', 'password123');
    const { token } = await authLogin('logout@gmail.com', 'password123');
    await expect(authLogout(token)).resolves.toBeUndefined();
  });
});