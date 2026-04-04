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
exports.getInvoicePDF = getInvoicePDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const xml_js_1 = require("xml-js");
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
const auth_1 = require("../AWS/auth/auth");
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
function safeGet(obj, ...keys) {
    return keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}
function getInvoicePDF(invoiceId, token) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        (0, auth_1.authenticate)(token);
        const decoded = jsonwebtoken_1.default.decode(token);
        const userId = decoded.userId;
        const invoiceResult = yield datastore_1.default.query(`SELECT invoiceId, userId, invoiceXML, status FROM invoices WHERE invoiceId = $1`, [invoiceId]);
        if (invoiceResult.rows.length === 0) {
            throw new class_1.HttpError('Invoice not found.', 404);
        }
        const invoice = invoiceResult.rows[0];
        if (invoice.userid !== userId) {
            throw new class_1.HttpError('Forbidden.', 403);
        }
        const parsed = (0, xml_js_1.xml2js)(invoice.invoicexml, { compact: true });
        const inv = parsed['Invoice'] || parsed['ubl:Invoice'] || Object.values(parsed)[0];
        const invoiceId2 = getText(inv['cbc:ID']);
        const issueDate = getText(inv['cbc:IssueDate']);
        const dueDate = getText(inv['cbc:DueDate']);
        const currency = getText(inv['cbc:DocumentCurrencyCode']);
        const seller = (_a = inv['cac:AccountingSupplierParty']) === null || _a === void 0 ? void 0 : _a['cac:Party'];
        const buyer = (_b = inv['cac:AccountingCustomerParty']) === null || _b === void 0 ? void 0 : _b['cac:Party'];
        const sellerName = getText(safeGet(seller, 'cac:PartyName', 'cbc:Name'));
        const sellerStreet = getText(safeGet(seller, 'cac:PostalAddress', 'cbc:StreetName'));
        const sellerCity = getText(safeGet(seller, 'cac:PostalAddress', 'cbc:CityName'));
        const sellerPostcode = getText(safeGet(seller, 'cac:PostalAddress', 'cbc:PostalZone'));
        const sellerCountry = getText(safeGet(seller, 'cac:PostalAddress', 'cac:Country', 'cbc:IdentificationCode'));
        const sellerTaxId = getText(safeGet(seller, 'cac:PartyTaxScheme', 'cbc:CompanyID'));
        const buyerName = getText(safeGet(buyer, 'cac:PartyName', 'cbc:Name'));
        const buyerStreet = getText(safeGet(buyer, 'cac:PostalAddress', 'cbc:StreetName'));
        const buyerCity = getText(safeGet(buyer, 'cac:PostalAddress', 'cbc:CityName'));
        const buyerPostcode = getText(safeGet(buyer, 'cac:PostalAddress', 'cbc:PostalZone'));
        const buyerCountry = getText(safeGet(buyer, 'cac:PostalAddress', 'cac:Country', 'cbc:IdentificationCode'));
        const monetary = inv['cac:LegalMonetaryTotal'];
        const subtotal = getText(monetary === null || monetary === void 0 ? void 0 : monetary['cbc:TaxExclusiveAmount']);
        const total = getText(monetary === null || monetary === void 0 ? void 0 : monetary['cbc:TaxInclusiveAmount']);
        const taxTotals = inv['cac:TaxTotal'];
        const taxAmount = getText(Array.isArray(taxTotals) ? (_c = taxTotals[0]) === null || _c === void 0 ? void 0 : _c['cbc:TaxAmount'] : taxTotals === null || taxTotals === void 0 ? void 0 : taxTotals['cbc:TaxAmount']);
        const rawLines = inv['cac:InvoiceLine'];
        const lines = Array.isArray(rawLines) ? rawLines : rawLines ? [rawLines] : [];
        const lineItems = lines.map((line) => ({
            description: getText(safeGet(line, 'cac:Item', 'cbc:Name')),
            quantity: getText(line['cbc:InvoicedQuantity']),
            rate: getText(safeGet(line, 'cac:Price', 'cbc:PriceAmount')),
            amount: getText(line['cbc:LineExtensionAmount']),
        }));
        // Build PDF
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            const margin = 50;
            const pageWidth = doc.page.width - margin * 2;
            const rightEdge = margin + pageWidth;
            const col2X = margin + pageWidth / 2;
            const totalsLabelX = margin + pageWidth * 0.6;
            const totalsValueWidth = pageWidth * 0.4;
            const totalsHalfWidth = totalsValueWidth * 0.5;
            // Header
            doc.fontSize(22).font('Helvetica-Bold').text('INVOICE', margin, 50);
            doc.fontSize(10).font('Helvetica')
                .text(`Invoice #: ${invoiceId2}`, { align: 'right' })
                .text(`Issue Date: ${issueDate}`, { align: 'right' })
                .text(`Due Date:   ${dueDate}`, { align: 'right' })
                .text(`Currency:   ${currency}`, { align: 'right' });
            doc.moveDown(2);
            // From / To
            const colY = doc.y;
            doc.font('Helvetica-Bold').fontSize(10).text('FROM', margin, colY);
            doc.font('Helvetica').fontSize(9)
                .text(sellerName, margin, doc.y)
                .text(sellerStreet)
                .text(`${sellerCity} ${sellerPostcode}`)
                .text(sellerCountry)
                .text(`ABN/Tax ID: ${sellerTaxId}`);
            const fromBottomY = doc.y;
            doc.font('Helvetica-Bold').fontSize(10).text('BILL TO', col2X, colY);
            doc.font('Helvetica').fontSize(9)
                .text(buyerName, col2X, colY + 14)
                .text(buyerStreet, col2X)
                .text(`${buyerCity} ${buyerPostcode}`, col2X)
                .text(buyerCountry, col2X);
            doc.y = Math.max(fromBottomY, doc.y) + 20;
            // Divider
            doc.moveTo(margin, doc.y).lineTo(rightEdge, doc.y).strokeColor('#cccccc').stroke();
            doc.moveDown(1);
            // Line Items Table Header
            const tableTop = doc.y;
            const descWidth = pageWidth * 0.45;
            const qtyWidth = pageWidth * 0.12;
            const rateWidth = pageWidth * 0.18;
            const amountWidth = pageWidth * 0.18;
            const qtyX = margin + descWidth;
            const rateX = qtyX + qtyWidth;
            const amountX = rateX + rateWidth;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('Description', margin, tableTop, { width: descWidth });
            doc.text('Qty', qtyX, tableTop, { width: qtyWidth, align: 'right' });
            doc.text('Rate', rateX, tableTop, { width: rateWidth, align: 'right' });
            doc.text('Amount', amountX, tableTop, { width: amountWidth, align: 'right' });
            doc.moveDown(0.5);
            doc.moveTo(margin, doc.y).lineTo(rightEdge, doc.y).strokeColor('#cccccc').stroke();
            doc.moveDown(0.5);
            // Line Items
            doc.font('Helvetica').fontSize(9);
            for (const item of lineItems) {
                const rowY = doc.y;
                doc.text(item.description, margin, rowY, { width: descWidth });
                doc.text(item.quantity, qtyX, rowY, { width: qtyWidth, align: 'right' });
                doc.text(Number(item.rate).toFixed(2), rateX, rowY, { width: rateWidth, align: 'right' });
                doc.text(Number(item.amount).toFixed(2), amountX, rowY, { width: amountWidth, align: 'right' });
                doc.moveDown(0.8);
            }
            // Divider 
            doc.moveDown(0.5);
            doc.moveTo(margin, doc.y).lineTo(rightEdge, doc.y).strokeColor('#cccccc').stroke();
            doc.moveDown(1);
            // Totals
            doc.font('Helvetica').fontSize(9);
            doc.text('Subtotal:', totalsLabelX, doc.y, { width: totalsHalfWidth });
            doc.text(`${currency} ${Number(subtotal).toFixed(2)}`, totalsLabelX + totalsHalfWidth, doc.y - doc.currentLineHeight(), { width: totalsHalfWidth, align: 'right' });
            doc.moveDown(0.5);
            doc.text('Tax:', totalsLabelX, doc.y, { width: totalsHalfWidth });
            doc.text(`${currency} ${Number(taxAmount).toFixed(2)}`, totalsLabelX + totalsHalfWidth, doc.y - doc.currentLineHeight(), { width: totalsHalfWidth, align: 'right' });
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text('Total:', totalsLabelX, doc.y, { width: totalsHalfWidth });
            doc.text(`${currency} ${Number(total).toFixed(2)}`, totalsLabelX + totalsHalfWidth, doc.y - doc.currentLineHeight(), { width: totalsHalfWidth, align: 'right' });
            // Footer
            doc.moveDown(3);
            doc.font('Helvetica').fontSize(8).fillColor('#888888')
                .text('Payment due within 30 days. Thank you for your business.', { align: 'center' });
            doc.end();
        });
    });
}
