import request from 'supertest';
import pool from '../../AWS/datastore';
import { HttpError } from '../../class';
import { authRegister, authLogin, authLogout, authenticate } from './auth';
import { describe, expect, test, afterAll, beforeEach } from '@jest/globals';
import { app } from '../../server';

beforeEach(async () => {
  // Override database config for local testing
  process.env.DB_HOST = 'localhost';
  process.env.DB_NAME = 'mission_control';
  process.env.DB_USER = 'postgres';
  process.env.DB_PASSWORD = 'postgres';
  process.env.DB_PORT = '5432';

  await pool.query('DELETE FROM invoices');
  await pool.query('DELETE FROM users');
}, 30000);

afterAll(async () => {
  await pool.end();
}, 30000);

describe('POST /v1/auth/register', () => {
  test('Successful registration', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
    expect(res.statusCode).toStrictEqual(201);
  });

  test('Missing email', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: '', password: 'correctpassword123' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('Missing password', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'test@gmail.com', password: '' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('Email already in use', async () => {
    await request(app)
      .post('/v1/auth/register')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('Registered user is stored in database', async () => {
    await request(app)
      .post('/v1/auth/register')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
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

describe('POST /v1/auth/login', () => {
  test('Correct login info', async () => {
    await request(app)
      .post('/v1/auth/register')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
    expect(res.body).toStrictEqual({ token: expect.any(String) });
    expect(res.statusCode).toStrictEqual(200);
  });

  test('Email does not exist', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'wrong@gmail.com', password: 'correctpassword123' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Password is incorrect', async () => {
    await request(app)
      .post('/v1/auth/register')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'test@gmail.com', password: 'wrongpassword123' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Missing email', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: '', password: 'correctpassword123' });
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
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

describe('POST /v1/auth/logout', () => {
  test('Successful logout', async () => {
    await request(app)
      .post('/v1/auth/register')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
    const loginRes = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'test@gmail.com', password: 'correctpassword123' });
    const { token } = loginRes.body;
    const res = await request(app)
      .post('/v1/auth/logout')
      .set('token', token);
    expect(res.statusCode).toStrictEqual(200);
  });

  test('No token provided', async () => {
    const res = await request(app)
      .post('/v1/auth/logout');
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
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