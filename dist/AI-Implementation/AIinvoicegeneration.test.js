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
(0, globals_1.describe)('POST /V1/ai/generate-invoice', () => {
    (0, globals_1.test)('Standard user can generate an invoice', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/generate-invoice')
            .set('token', token)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.invoice).toStrictEqual(globals_1.expect.any(Object));
    }));
    (0, globals_1.test)('Pro user can generate an invoice', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/generate-invoice')
            .set('token', proToken)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.invoice).toStrictEqual(globals_1.expect.any(Object));
    }));
    (0, globals_1.test)('AI returns invalid JSON', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockCreate = globals_1.jest.fn().mockImplementation(() => Promise.resolve({
            content: [{ type: 'text', text: 'This is an invalid response without JSON.' }]
        }));
        const MockAnthropic = globals_1.jest.fn().mockImplementation(() => ({
            messages: { create: mockCreate }
        }));
        globals_1.jest.mock('@anthropic-ai/sdk', () => ({
            __esModule: true,
            default: MockAnthropic
        }));
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/ai/generate-invoice')
            .set('token', token)
            .send({ description: 'Generate an invoice for a consulting service provided to ABC Corp, including 10 hours of work at $100/hour, with a due date of 2024-12-31.' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(500);
        (0, globals_1.expect)(res.body.error).toBe('AI returned invalid JSON.');
    }));
    globals_1.test;
});
