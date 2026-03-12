import request from 'sync-request-curl';
import pool from '../datastore'
const SERVER_URL = 'http://localhost:3000';

beforeEach(async () => {
  await pool.query('DELETE FROM invoices');
  await pool.query('DELETE FROM users');
});

afterAll(async () => {
  await pool.end();
});

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
});