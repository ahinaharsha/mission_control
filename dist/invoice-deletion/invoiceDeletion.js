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
exports.deleteInvoice = deleteInvoice;
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
const auth_1 = require("../AWS/auth/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ALLOWED_STATUSES = ['Generated', 'InProgress'];
function deleteInvoice(invoiceId, token) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, auth_1.authenticate)(token);
        const decoded = jsonwebtoken_1.default.decode(token);
        const userId = decoded.userId;
        const invoiceResult = yield datastore_1.default.query(`SELECT * FROM invoices WHERE invoiceId = $1`, [invoiceId]);
        if (invoiceResult.rows.length === 0) {
            throw new class_1.HttpError('Invoice not found.', 404);
        }
        const invoice = invoiceResult.rows[0];
        if (invoice.userid !== userId) {
            throw new class_1.HttpError('Forbidden.', 403);
        }
        if (!ALLOWED_STATUSES.includes(invoice.status)) {
            throw new class_1.HttpError('Invoice already finalised, sent, or paid.', 409);
        }
        yield datastore_1.default.query(`DELETE FROM invoices WHERE invoiceId = $1`, [invoiceId]);
        return { message: 'Invoice deleted successfully.' };
    });
}
