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
exports.generateInvoiceFromAI = generateInvoiceFromAI;
exports.generateInvoicePrefill = generateInvoicePrefill;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
const auth_1 = require("../AWS/auth/auth");
const generator_1 = require("../invoice-generator/generator");
const generator_2 = require("../invoice-generator/generator");
const chat_1 = require("./chat");
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
const STANDARD_MESSAGE_LIMIT = 25;
const STANDARD_SYSTEM_PROMPT = `You are an expert invoicing assistant for MC Invoicing.
Convert the user's request into valid JSON that matches the InvoiceInput TypeScript shape.

REQUIRED FIELDS (must be provided or inferred):
- customer: fullName, email, phone, billingAddress (street, city, postcode, country), shippingAddress
- from: businessName, address (street, city, postcode, country), taxId, abnNumber, dueDate (YYYY-MM-DD)
- lineItems: array with at least one item containing description, quantity (number), rate (number)
- currency: 3-letter ISO code (e.g., "AUD")
- tax: taxId, countryCode, taxPercentage (number)

If the user doesn't provide enough information to fill all required fields, return a JSON with an "error" field explaining what's missing instead of incomplete invoice data.

Return only the JSON object and do not include any additional explanation.`;
const PRO_SYSTEM_PROMPT = `You are an expert invoicing assistant for MC Invoicing.
Convert the user's request into valid JSON that matches the InvoiceInput TypeScript shape for frontend prefill.

REQUIRED FIELDS (must be provided or inferred):
- customer: fullName, email, phone, billingAddress (street, city, postcode, country), shippingAddress
- from: businessName, address (street, city, postcode, country), taxId, abnNumber, dueDate (YYYY-MM-DD)
- lineItems: array with at least one item containing description, quantity (number), rate (number)
- currency: 3-letter ISO code (e.g., "AUD")
- tax: taxId, countryCode, taxPercentage (number)

If insufficient information is provided, return a JSON with an "error" field listing missing requirements rather than incomplete data.

Return only the JSON object and do not include any additional explanation.`;
function incrementMessageCount(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield datastore_1.default.query(`UPDATE users SET message_count = message_count + 1 WHERE userId = $1`, [userId]);
    });
}
function extractJsonText(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
        throw new class_1.HttpError('AI returned invalid JSON.', 500);
    }
    return text.slice(start, end + 1);
}
function normalizeInvoiceInput(raw) {
    var _a;
    if (!raw || typeof raw !== 'object') {
        throw new class_1.HttpError('AI returned an invalid invoice payload.', 500);
    }
    // Check if AI returned an error instead of invoice data
    if (raw.error) {
        throw new class_1.HttpError(`Insufficient information provided: ${raw.error}`, 400);
    }
    const invoice = Object.assign({}, raw);
    if ((_a = invoice.from) === null || _a === void 0 ? void 0 : _a.dueDate) {
        invoice.from.dueDate = new Date(invoice.from.dueDate);
    }
    if (Array.isArray(invoice.lineItems)) {
        invoice.lineItems = invoice.lineItems.map((item) => ({
            description: item.description || '',
            quantity: Number(item.quantity || 0),
            rate: Number(item.rate || 0),
        }));
    }
    return invoice;
}
function requestInvoiceInputFromAI(token_1, description_1, systemPrompt_1) {
    return __awaiter(this, arguments, void 0, function* (token, description, systemPrompt, includeHistory = false) {
        var _a, _b;
        (0, auth_1.authenticate)(token);
        const user = yield (0, chat_1.getUserFromToken)(token);
        const messages = includeHistory ? yield (0, chat_1.getChatHistory)(user.userid) : [];
        messages.push({ role: 'user', content: description });
        const response = yield client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1500,
            system: systemPrompt,
            messages,
        });
        const assistantMessage = ((_b = (_a = response.content) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.type) === 'text' ? response.content[0].text : '';
        if (!assistantMessage) {
            throw new class_1.HttpError('AI did not return a valid response.', 500);
        }
        const jsonText = extractJsonText(assistantMessage);
        const parsed = JSON.parse(jsonText);
        return normalizeInvoiceInput(parsed);
    });
}
function generateInvoiceFromAI(token, description) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        (0, auth_1.authenticate)(token);
        const user = yield (0, chat_1.getUserFromToken)(token);
        const currentCount = (_a = yield (0, chat_1.resetMessageCountIfNeeded)(user.userid)) !== null && _a !== void 0 ? _a : user.message_count;
        if (user.tier === 'standard' && currentCount >= STANDARD_MESSAGE_LIMIT) {
            throw new class_1.HttpError('Daily message limit reached. Upgrade to Pro for unlimited AI invoice generation.', 429);
        }
        const input = yield requestInvoiceInputFromAI(token, description, STANDARD_SYSTEM_PROMPT, false);
        // Additional validation to ensure AI provided complete data
        try {
            (0, generator_2.validateInvoiceInput)(input);
        }
        catch (validationError) {
            throw new class_1.HttpError(`AI could not generate a complete invoice. Please provide more details: ${validationError.message}`, 400);
        }
        const result = yield (0, generator_1.generateInvoiceFromInput)(input, token);
        if (user.tier === 'standard') {
            yield incrementMessageCount(user.userid);
        }
        return result;
    });
}
function generateInvoicePrefill(token, description) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, auth_1.authenticate)(token);
        const user = yield (0, chat_1.getUserFromToken)(token);
        if (user.tier !== 'pro') {
            throw new class_1.HttpError('Autofill is only available for Pro users.', 403);
        }
        const input = yield requestInvoiceInputFromAI(token, description, PRO_SYSTEM_PROMPT, true);
        // For pro users, we still validate but return the draft even if incomplete
        // The frontend can handle showing validation errors
        return {
            draft: input,
            message: 'Invoice draft generated successfully.',
        };
    });
}
