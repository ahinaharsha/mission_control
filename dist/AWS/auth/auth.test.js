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
const supertest_1 = __importDefault(require("supertest"));
const datastore_1 = __importDefault(require("../../AWS/datastore"));
const class_1 = require("../../class");
const auth_1 = require("./auth");
const globals_1 = require("@jest/globals");
const server_1 = require("../../server");
(0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.query('DELETE FROM invoices');
    yield datastore_1.default.query('DELETE FROM users');
}), 30000);
(0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.end();
}), 30000);
(0, globals_1.describe)('POST /v1/auth/register', () => {
    (0, globals_1.test)('Successful registration', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(201);
    }));
    (0, globals_1.test)('Missing email', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: '', password: 'correctpassword123' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
    }));
    (0, globals_1.test)('Missing password', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: 'test@gmail.com', password: '' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
    }));
    (0, globals_1.test)('Email already in use', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
    }));
    (0, globals_1.test)('Registered user is stored in database', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        const result = yield datastore_1.default.query('SELECT * FROM users WHERE email = $1', ['test@gmail.com']);
        (0, globals_1.expect)(result.rows.length).toStrictEqual(1);
        (0, globals_1.expect)(result.rows[0].email).toStrictEqual('test@gmail.com');
    }));
    (0, globals_1.test)('missing email throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, globals_1.expect)((0, auth_1.authRegister)('', 'password123')).rejects.toThrow(class_1.HttpError);
    }));
    (0, globals_1.test)('missing password throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, globals_1.expect)((0, auth_1.authRegister)('test@gmail.com', '')).rejects.toThrow(class_1.HttpError);
    }));
});
(0, globals_1.describe)('authRegister direct', () => {
    (0, globals_1.test)('Email already in use throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, auth_1.authRegister)('direct@gmail.com', 'password123');
        yield (0, globals_1.expect)((0, auth_1.authRegister)('direct@gmail.com', 'password123')).rejects.toBeInstanceOf(class_1.HttpError);
    }));
});
(0, globals_1.describe)('POST /v1/auth/login', () => {
    (0, globals_1.test)('Correct login info', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/login')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        (0, globals_1.expect)(res.body).toStrictEqual({ token: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
    }));
    (0, globals_1.test)('Email does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/login')
            .send({ email: 'wrong@gmail.com', password: 'correctpassword123' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Password is incorrect', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/login')
            .send({ email: 'test@gmail.com', password: 'wrongpassword123' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Missing email', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/login')
            .send({ email: '', password: 'correctpassword123' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
    }));
    (0, globals_1.test)('missing email throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, globals_1.expect)((0, auth_1.authLogin)('', 'password123')).rejects.toThrow(class_1.HttpError);
    }));
    (0, globals_1.test)('missing password throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, globals_1.expect)((0, auth_1.authLogin)('test@gmail.com', '')).rejects.toThrow(class_1.HttpError);
    }));
});
(0, globals_1.describe)('authLogin direct', () => {
    (0, globals_1.test)('Wrong password throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, auth_1.authRegister)('direct2@gmail.com', 'password123');
        yield (0, globals_1.expect)((0, auth_1.authLogin)('direct2@gmail.com', 'wrongpassword')).rejects.toBeInstanceOf(class_1.HttpError);
    }));
    (0, globals_1.test)('Email does not exist throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, globals_1.expect)((0, auth_1.authLogin)('nonexistent@gmail.com', 'password123')).rejects.toBeInstanceOf(class_1.HttpError);
    }));
});
(0, globals_1.describe)('POST /v1/auth/logout', () => {
    (0, globals_1.test)('Successful logout', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/register')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        const loginRes = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/login')
            .send({ email: 'test@gmail.com', password: 'correctpassword123' });
        const { token } = loginRes.body;
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/logout')
            .set('token', token);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
    }));
    (0, globals_1.test)('No token provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/auth/logout');
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('missing token throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, globals_1.expect)((0, auth_1.authLogout)(undefined)).rejects.toThrow(class_1.HttpError);
    }));
});
(0, globals_1.describe)('authenticate function', () => {
    (0, globals_1.test)('No token throws 401', () => {
        (0, globals_1.expect)(() => (0, auth_1.authenticate)(undefined)).toThrow(class_1.HttpError);
    });
    (0, globals_1.test)('Invalid token throws 401', () => {
        (0, globals_1.expect)(() => (0, auth_1.authenticate)('invalidtoken123')).toThrow(class_1.HttpError);
    });
    (0, globals_1.test)('Successful logout direct', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, auth_1.authRegister)('logout@gmail.com', 'password123');
        const { token } = yield (0, auth_1.authLogin)('logout@gmail.com', 'password123');
        yield (0, globals_1.expect)((0, auth_1.authLogout)(token)).resolves.toBeUndefined();
    }));
});
