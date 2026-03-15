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
function retrieveInvoices(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield datastore_1.default.query('SELECT invoiceId, userId, invoiceXML as xml, status FROM invoices WHERE userId = $1', [userId]);
            return result.rows.map(row => ({
                invoiceId: row.invoiceid,
                userId: row.userid,
                xml: row.xml,
                status: row.status
            }));
        }
        catch (error) {
            console.error('Error retrieving invoices:', error);
            throw new class_1.HttpError('Failed to retrieve invoices', 500);
        }
    });
}
