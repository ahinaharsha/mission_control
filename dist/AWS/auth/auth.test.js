"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sync_request_curl_1 = __importDefault(require("sync-request-curl"));
const datastore_1 = __importDefault(require("../datastore"));
const class_1 = require("../../class");
const auth_1 = require("./auth");
const SERVER_URL = 'http://localhost:3000';
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.query('DELETE FROM invoices');
    yield datastore_1.default.query('DELETE FROM users');
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.end();
}));
describe('POST /auth/register', () => {
    test('Successful registration', () => {
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        expect(result.statusCode).toStrictEqual(201);
    });
    test('Missing email', () => {
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: '', password: 'correctpassword123' }
        });
        const body = JSON.parse(result.body.toString());
        expect(body).toStrictEqual({ error: expect.any(String) });
        expect(result.statusCode).toStrictEqual(400);
    });
    test('Missing password', () => {
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: 'test@gmail.com', password: '' }
        });
        const body = JSON.parse(result.body.toString());
        expect(body).toStrictEqual({ error: expect.any(String) });
        expect(result.statusCode).toStrictEqual(400);
    });
    test('Email already in use', () => {
        (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        const body = JSON.parse(result.body.toString());
        expect(body).toStrictEqual({ error: expect.any(String) });
        expect(result.statusCode).toStrictEqual(400);
    });
    test('Registered user is stored in database', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        const result = yield datastore_1.default.query('SELECT * FROM users WHERE email = $1', ['test@gmail.com']);
        expect(result.rows.length).toStrictEqual(1);
        expect(result.rows[0].email).toStrictEqual('test@gmail.com');
    }));
    test('missing email throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        expect((0, auth_1.authRegister)('', 'password123')).rejects.toThrow(class_1.HttpError);
    }));
    test('missing password throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        expect((0, auth_1.authRegister)('test@gmail.com', '')).rejects.toThrow(class_1.HttpError);
    }));
});
describe('POST /auth/login', () => {
    test('Correct login info', () => {
        (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/login`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        const body = JSON.parse(result.body.toString());
        expect(body).toStrictEqual({ token: expect.any(String) });
        expect(result.statusCode).toStrictEqual(200);
    });
    test('Email does not exist', () => {
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/login`, {
            json: { email: 'wrong@gmail.com', password: 'correctpassword123' }
        });
        const body = JSON.parse(result.body.toString());
        expect(body).toStrictEqual({ error: expect.any(String) });
        expect(result.statusCode).toStrictEqual(401);
    });
    test('Password is incorrect', () => {
        (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/login`, {
            json: { email: 'test@gmail.com', password: 'wrongpassword123' }
        });
        const body = JSON.parse(result.body.toString());
        expect(body).toStrictEqual({ error: expect.any(String) });
        expect(result.statusCode).toStrictEqual(401);
    });
    test('Missing email', () => {
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/login`, {
            json: { email: '', password: 'correctpassword123' }
        });
        const body = JSON.parse(result.body.toString());
        expect(body).toStrictEqual({ error: expect.any(String) });
        expect(result.statusCode).toStrictEqual(400);
    });
    test('missing email throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        expect((0, auth_1.authLogin)('', 'password123')).rejects.toThrow(class_1.HttpError);
    }));
    test('missing password throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        expect((0, auth_1.authLogin)('test@gmail.com', '')).rejects.toThrow(class_1.HttpError);
    }));
});
describe('POST /auth/logout', () => {
    test('Successful logout', () => {
        (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/register`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        const loginResult = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/login`, {
            json: { email: 'test@gmail.com', password: 'correctpassword123' }
        });
        const { token } = JSON.parse(loginResult.body.toString());
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/logout`, {
            headers: { token }
        });
        expect(result.statusCode).toStrictEqual(200);
    });
    test('No token provided', () => {
        const result = (0, sync_request_curl_1.default)('POST', `${SERVER_URL}/auth/logout`, {});
        const body = JSON.parse(result.body.toString());
        expect(body).toStrictEqual({ error: expect.any(String) });
        expect(result.statusCode).toStrictEqual(401);
    });
    test('missing token throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        expect((0, auth_1.authLogout)(undefined)).rejects.toThrow(class_1.HttpError);
    }));
});
describe('authenticate function', () => {
    test('No token throws 401', () => {
        expect(() => (0, auth_1.authenticate)(undefined)).toThrow(class_1.HttpError);
    });
    test('Invalid token throws 401', () => {
        expect(() => (0, auth_1.authenticate)('invalidtoken123')).toThrow(class_1.HttpError);
    });
});
