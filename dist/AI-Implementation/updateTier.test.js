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
let token;
(0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.query('DELETE FROM chat_history');
    yield datastore_1.default.query('DELETE FROM invoices');
    yield datastore_1.default.query('DELETE FROM users');
    const testEmail = `test-${Date.now()}@gmail.com`;
    yield (0, auth_1.authRegister)(testEmail, 'correctpassword123');
    const loginRes = yield (0, auth_1.authLogin)(testEmail, 'correctpassword123');
    token = loginRes.token;
}), 30000);
(0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.end();
}), 30000);
(0, globals_1.describe)('PUT /v1/users/tier', () => {
    (0, globals_1.test)('Successfully upgrades user to pro', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .set('token', token)
            .send({ tier: 'pro' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.message).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(res.body.tier).toBe('pro');
    }));
    (0, globals_1.test)('Successfully downgrades user to standard', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .set('token', token)
            .send({ tier: 'pro' });
        const res = yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .set('token', token)
            .send({ tier: 'standard' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.tier).toBe('standard');
    }));
    (0, globals_1.test)('Invalid tier', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .set('token', token)
            .send({ tier: 'enterprise' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
    }));
    (0, globals_1.test)('Missing tier', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .set('token', token)
            .send({});
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
    }));
    (0, globals_1.test)('No token', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .send({ tier: 'pro' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Invalid token', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .set('token', 'invalidtoken')
            .send({ tier: 'pro' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Tier is actually updated in database', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .set('token', token)
            .send({ tier: 'pro' });
        const decoded = require('jsonwebtoken').decode(token);
        const result = yield datastore_1.default.query(`SELECT tier FROM users WHERE userId = $1`, [decoded.userId]);
        (0, globals_1.expect)(result.rows[0].tier).toBe('pro');
    }));
    (0, globals_1.test)('User not found', () => __awaiter(void 0, void 0, void 0, function* () {
        const decoded = require('jsonwebtoken').decode(token);
        yield datastore_1.default.query(`DELETE FROM users WHERE userId = $1`, [decoded.userId]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .put('/v1/users/tier')
            .set('token', token)
            .send({ tier: 'pro' });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(404);
    }));
});
