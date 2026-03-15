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
exports.authRegister = authRegister;
exports.authLogin = authLogin;
exports.authenticate = authenticate;
exports.authLogout = authLogout;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const datastore_1 = __importDefault(require("../datastore"));
const class_1 = require("../../class");
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
function authRegister(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!email || !password) {
            throw new class_1.HttpError('Email and password are required.', 400);
        }
        const existing = yield datastore_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            throw new class_1.HttpError('Email already in use.', 400);
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, SALT_ROUNDS);
        const userId = (0, uuid_1.v4)();
        yield datastore_1.default.query('INSERT INTO users (userId, email, password) VALUES ($1, $2, $3)', [userId, email, hashedPassword]);
    });
}
function authLogin(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!email || !password) {
            throw new class_1.HttpError('Email and password are required.', 400);
        }
        // Fetch user from database
        const result = yield datastore_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            throw new class_1.HttpError('Invalid email or password.', 401);
        }
        const user = result.rows[0];
        // Compare password with hashed password
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (!match) {
            throw new class_1.HttpError('Invalid email or password.', 401);
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({ userId: user.userid }, JWT_SECRET, { expiresIn: '24h' });
        // Store token in database
        yield datastore_1.default.query('UPDATE users SET token = $1 WHERE userId = $2', [token, user.userid]);
        return { token };
    });
}
function authenticate(token) {
    if (!token) {
        throw new class_1.HttpError('Not logged in.', 401);
    }
    try {
        jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (e) {
        throw new class_1.HttpError('Invalid or expired token.', 401);
    }
}
function authLogout(token) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            throw new class_1.HttpError('Not logged in.', 401);
        }
        yield datastore_1.default.query('UPDATE users SET token = NULL WHERE token = $1', [token]);
    });
}
