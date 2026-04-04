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
exports.updateInvoice = updateInvoice;
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
const auth_1 = require("../AWS/auth/auth");
const generator_1 = require("../invoice-generator/generator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ALLOWED_STATUSES = ['Generated', 'InProgress'];
function updateInvoice(invoiceId, token, updates) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, auth_1.authenticate)(token);
        const decoded = jsonwebtoken_1.default.decode(token);
        const userId = decoded.userId;
        const invoiceResult = yield datastore_1.default.query(`SELECT * FROM invoices WHERE invoiceId = $1`, [invoiceId]);
        if (invoiceResult.rows.length === 0) {
            throw new class_1.HttpError('Invoice not found.', 404);
        }
        const invoice = invoiceResult.rows[0];
        if (!invoice.invoicedata) {
            throw new class_1.HttpError('Invoice data not found.', 404);
        }
        if (invoice.userid !== userId) {
            throw new class_1.HttpError('Forbidden.', 403);
        }
        if (!ALLOWED_STATUSES.includes(invoice.status)) {
            throw new class_1.HttpError('Invoice already finalised.', 409);
        }
        const existing = invoice.invoicedata;
        if (updates.customer) {
            existing.customer = updates.customer;
        }
        if (updates.lineItems) {
            existing.lineItems = updates.lineItems;
        }
        if (updates.currency) {
            existing.currency = updates.currency;
        }
        if (updates.tax) {
            existing.tax = updates.tax;
        }
        if (updates.from) {
            existing.from = updates.from;
        }
        (0, generator_1.validateInvoiceInput)(existing);
        if (existing.from.dueDate) {
            existing.from.dueDate = new Date(existing.from.dueDate);
        }
        const updatedXML = (0, generator_1.create_invoice)(existing);
        yield datastore_1.default.query(`UPDATE invoices SET invoiceXML = $1, invoiceData = $2 WHERE invoiceId = $3`, [updatedXML, JSON.stringify(existing), invoiceId]);
        return { message: 'Invoice updated successfully.' };
    });
}
