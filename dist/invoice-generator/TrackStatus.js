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
exports.getStatus = getStatus;
exports.updateStatus = updateStatus;
const xml_js_1 = require("xml-js");
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getText(node) {
    if (!node) {
        return '';
    }
    if (node._text) {
        return String(node._text);
    }
    return '';
}
function getStatus(invoiceId, token) {
    return __awaiter(this, void 0, void 0, function* () {
        //Returns the status of the invoice with the given ID. Possible statuses: "Generated", "InProgress", "Sent", "Paid", "Overdue", "Deleted"
        if (!token) {
            throw new class_1.HttpError('Not logged in.', 401);
        }
        const decoded = jsonwebtoken_1.default.decode(token);
        const userId = decoded.userId;
        const invoiceResult = yield datastore_1.default.query(`SELECT userid,invoiceXML,status FROM invoices WHERE invoiceId = $1`, [invoiceId]);
        //get the status from the database and return it. If the invoice is not found, return 404. If the invoice belongs to another user, return 403.
        if (invoiceResult.rows.length === 0) {
            throw new class_1.HttpError('Invoice not found.', 404);
        }
        const invoice = invoiceResult.rows[0];
        if (invoice.userid !== userId) {
            throw new class_1.HttpError('Forbidden.', 403);
        }
        const parsed = (0, xml_js_1.xml2js)(invoice.invoicexml, { compact: true });
        const inv = parsed.Invoice;
        // Extract due date from invoice XML
        const dueDateStr = getText(inv['cbc:DueDate']);
        let currentStatus = invoice.status;
        if (currentStatus === 'overdue') {
            return currentStatus;
        }
        // If invoice is not yet paid or deleted, check if it's overdue
        if (currentStatus !== 'Paid' && dueDateStr) {
            const dueDateObj = new Date(dueDateStr);
            const dueDate = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
            const Year = new Date().getFullYear();
            const month = new Date().getMonth();
            const day = new Date().getDate();
            const nowDateOnly = new Date(Year, month, day);
            if (dueDate < nowDateOnly) {
                currentStatus = 'Overdue';
                yield datastore_1.default.query(`UPDATE invoices SET status = $1 WHERE invoiceId = $2`, [currentStatus, invoiceId]);
            }
        }
        return currentStatus;
    });
}
function updateStatus(invoiceId, status, token) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            throw new class_1.HttpError('Not logged in.', 401);
        }
        const decoded = jsonwebtoken_1.default.decode(token);
        // Verify status is valid
        const validStatuses = ['Generated', 'InProgress', 'Sent', 'Paid', 'Overdue', 'Deleted'];
        if (!validStatuses.includes(status)) {
            throw new class_1.HttpError('Invalid status value.', 400);
        }
        const userId = decoded.userId;
        // Verify invoice exists and belongs to user
        const invoiceResult = yield datastore_1.default.query(`SELECT userid FROM invoices WHERE invoiceId = $1`, [invoiceId]);
        if (invoiceResult.rows.length === 0) {
            throw new class_1.HttpError('Invoice not found.', 404);
        }
        if (invoiceResult.rows[0].userid !== userId) {
            throw new class_1.HttpError('Forbidden.', 403);
        }
        // Update status
        yield datastore_1.default.query(`UPDATE invoices SET status = $1 WHERE invoiceId = $2`, [status, invoiceId]);
    });
}
