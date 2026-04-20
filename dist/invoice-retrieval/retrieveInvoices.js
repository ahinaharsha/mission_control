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
exports.retrieveInvoices = retrieveInvoices;
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
const auth_1 = require("../AWS/auth/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function retrieveInvoices(invoiceId, token) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, auth_1.authenticate)(token);
        const decoded = jsonwebtoken_1.default.decode(token);
        const userId = decoded.userId;
        const result = yield datastore_1.default.query('SELECT invoiceId, userId, invoiceXML as xml, invoiceData, status FROM invoices WHERE invoiceId = $1', [invoiceId]);
        if (result.rows.length === 0) {
            throw new class_1.HttpError('Invoice not found.', 404);
        }
        const invoice = result.rows[0];
        if (invoice.userid !== userId) {
            throw new class_1.HttpError('Forbidden.', 403);
        }
        return {
            invoiceId: invoice.invoiceid,
            userId: invoice.userid,
            xml: invoice.xml,
            invoicedata: invoice.invoicedata,
            status: invoice.status
        };
    });
}
