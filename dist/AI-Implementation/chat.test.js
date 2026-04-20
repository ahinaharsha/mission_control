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
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const datastore_1 = __importDefault(require("../AWS/datastore"));
const auth_1 = require("../AWS/auth/auth");
globals_1.jest.mock('@anthropic-ai/sdk', () => {
    const mockCreate = globals_1.jest.fn().mockImplementation(() => Promise.resolve({
        content: [{ type: 'text', text: 'This is a mocked AI response.' }]
    }));
    const MockAnthropic = globals_1.jest.fn().mockImplementation(() => ({
        messages: { create: mockCreate }
    }));
    return {
        __esModule: true,
        default: MockAnthropic
    };
});
let token;
let proToken;
(0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.query('DELETE FROM chat_history');
    yield datastore_1.default.query('DELETE FROM invoices');
    yield datastore_1.default.query('DELETE FROM users');
    const testEmail = `test-${Date.now()}@gmail.com`;
    yield (0, auth_1.authRegister)(testEmail, 'correctpassword123');
    const loginRes = yield (0, auth_1.authLogin)(testEmail, 'correctpassword123');
    token = loginRes.token;
    const proEmail = `pro-${Date.now()}@gmail.com`;
    yield (0, auth_1.authRegister)(proEmail, 'correctpassword123');
    const proLoginRes = yield (0, auth_1.authLogin)(proEmail, 'correctpassword123');
    proToken = proLoginRes.token;
    const proDecoded = require('jsonwebtoken').decode(proToken);
    yield datastore_1.default.query(`UPDATE users SET tier = 'pro' WHERE userId = $1`, [proDecoded.userId]);
}), 30000);
(0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.end();
}), 30000);
(0, globals_1.describe)('POST /v1/ai/chat', () => {
    (0, globals_1.test)('Standard user can send a message and receive a response', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', token)
            .send({ message: 'What is a Peppol invoice?' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.message).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(res.body.tier).toBe('standard');
        (0, globals_1.expect)(res.body.messagesRemaining).toStrictEqual(globals_1.expect.any(Number));
    }));
    (0, globals_1.test)('Pro user can send a message and receive a response', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', proToken)
            .send({ message: 'How do I create an invoice?' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.message).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(res.body.tier).toBe('pro');
        (0, globals_1.expect)(res.body.messagesRemaining).toBeNull();
    }));
    (0, globals_1.test)('Pro user chat history is stored', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', proToken)
            .send({ message: 'What is GST?' });
        const decoded = require('jsonwebtoken').decode(proToken);
        const result = yield datastore_1.default.query(`SELECT * FROM chat_history WHERE userId = $1`, [decoded.userId]);
        (0, globals_1.expect)(result.rows.length).toBeGreaterThan(0);
    }));
    (0, globals_1.test)('Standard user chat history is not stored', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', token)
            .send({ message: 'What is GST?' });
        const decoded = require('jsonwebtoken').decode(token);
        const result = yield datastore_1.default.query(`SELECT * FROM chat_history WHERE userId = $1`, [decoded.userId]);
        (0, globals_1.expect)(result.rows.length).toStrictEqual(0);
    }));
    (0, globals_1.test)('Missing message', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', token)
            .send({});
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
    }));
    (0, globals_1.test)('No token', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .send({ message: 'What is GST?' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Invalid token', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', 'invalidtoken')
            .send({ message: 'What is GST?' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Standard user message limit is enforced', () => __awaiter(void 0, void 0, void 0, function* () {
        const decoded = require('jsonwebtoken').decode(token);
        yield datastore_1.default.query(`UPDATE users SET message_count = 25, last_reset_date = CURRENT_DATE WHERE userId = $1`, [decoded.userId]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', token)
            .send({ message: 'What is GST?' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(429);
    }));
    (0, globals_1.test)('User not found', () => __awaiter(void 0, void 0, void 0, function* () {
        const decoded = require('jsonwebtoken').decode(token);
        yield datastore_1.default.query(`DELETE FROM users WHERE userId = $1`, [decoded.userId]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', token)
            .send({ message: 'What is GST?' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(404);
    }));
});
(0, globals_1.describe)('DELETE /v1/ai/chat/history', () => {
    (0, globals_1.test)('Pro user can clear chat history', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/chat')
            .set('token', proToken)
            .send({ message: 'What is GST?' });
        const res = yield (0, supertest_1.default)(server_1.app)
            .delete('/v1/ai/chat/history')
            .set('token', proToken);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body).toStrictEqual({ message: globals_1.expect.any(String) });
        const decoded = require('jsonwebtoken').decode(proToken);
        const result = yield datastore_1.default.query(`SELECT * FROM chat_history WHERE userId = $1`, [decoded.userId]);
        (0, globals_1.expect)(result.rows.length).toStrictEqual(0);
    }));
    (0, globals_1.test)('Standard user cannot clear chat history', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .delete('/v1/ai/chat/history')
            .set('token', token);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(403);
    }));
    (0, globals_1.test)('No token', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .delete('/v1/ai/chat/history');
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
});
