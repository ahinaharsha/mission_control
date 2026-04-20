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
exports.getUserFromToken = getUserFromToken;
exports.resetMessageCountIfNeeded = resetMessageCountIfNeeded;
exports.getChatHistory = getChatHistory;
exports.chat = chat;
exports.clearChatHistory = clearChatHistory;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
const auth_1 = require("../AWS/auth/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
const STANDARD_MESSAGE_LIMIT = 25;
const SYSTEM_PROMPT = `You are an expert invoicing assistant for MC Invoicing, a Peppol UBL-compliant invoice management platform. 
You help users with:
- Understanding invoicing concepts and best practices
- Explaining Peppol UBL standards and compliance requirements
- Answering questions about GST, tax, and currency
- Guiding users through creating, updating, and managing invoices
- Australian invoicing regulations and requirements
Keep responses concise, professional, and relevant to invoicing.`;
function getUserFromToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const decoded = jsonwebtoken_1.default.decode(token);
        const result = yield datastore_1.default.query(`SELECT userId, tier, message_count, last_reset_date FROM users WHERE userId = $1`, [decoded.userId]);
        if (result.rows.length === 0) {
            throw new class_1.HttpError('User not found.', 404);
        }
        return result.rows[0];
    });
}
function resetMessageCountIfNeeded(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield datastore_1.default.query(`UPDATE users SET message_count = 0, last_reset_date = CURRENT_DATE 
     WHERE userId = $1 AND last_reset_date < CURRENT_DATE
     RETURNING message_count`, [userId]);
        return result.rows.length > 0 ? 0 : null;
    });
}
function getChatHistory(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield datastore_1.default.query(`SELECT role, content FROM chat_history WHERE userId = $1 ORDER BY createdAt ASC`, [userId]);
        return result.rows.map(row => ({
            role: row.role,
            content: row.content
        }));
    });
}
function saveChatHistory(userId, role, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield datastore_1.default.query(`INSERT INTO chat_history (id, userId, role, content) VALUES ($1, $2, $3, $4)`, [(0, uuid_1.v4)(), userId, role, content]);
    });
}
function chat(token, message) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, auth_1.authenticate)(token);
        const user = yield getUserFromToken(token);
        const userId = user.userid;
        const tier = user.tier;
        const resetCount = yield resetMessageCountIfNeeded(userId);
        const currentCount = resetCount !== null ? resetCount : user.message_count;
        if (tier === 'standard' && currentCount >= STANDARD_MESSAGE_LIMIT) {
            throw new class_1.HttpError('Daily message limit reached. Upgrade to Pro for unlimited messages.', 429);
        }
        const history = tier === 'pro' ? yield getChatHistory(userId) : [];
        const messages = [...history, { role: 'user', content: message }];
        const response = yield client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages
        });
        const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';
        if (tier === 'pro') {
            yield saveChatHistory(userId, 'user', message);
            yield saveChatHistory(userId, 'assistant', assistantMessage);
        }
        if (tier === 'standard') {
            yield datastore_1.default.query(`UPDATE users SET message_count = message_count + 1 WHERE userId = $1`, [userId]);
        }
        return {
            message: assistantMessage,
            tier,
            messagesRemaining: tier === 'standard' ? STANDARD_MESSAGE_LIMIT - currentCount - 1 : null
        };
    });
}
function clearChatHistory(token) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, auth_1.authenticate)(token);
        const user = yield getUserFromToken(token);
        if (user.tier !== 'pro') {
            throw new class_1.HttpError('Chat history is only available for Pro users.', 403);
        }
        yield datastore_1.default.query(`DELETE FROM chat_history WHERE userId = $1`, [user.userid]);
        return { message: 'Chat history cleared.' };
    });
}
