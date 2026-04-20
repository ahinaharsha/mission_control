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
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const datastore_1 = __importDefault(require("../AWS/datastore"));
const auth_1 = require("../AWS/auth/auth");
const globals_1 = require("@jest/globals");
const validxml = `<?xml version="1.0" encoding="UTF-8"?>
<Order xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns="urn:oasis:names:specification:ubl:schema:xsd:Order-2">
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:ID>AEG012345</cbc:ID>
  <cbc:IssueDate>2005-06-20</cbc:IssueDate>
  <cac:BuyerCustomerParty>
    <cbc:CustomerAssignedAccountID>XFB01</cbc:CustomerAssignedAccountID>
    <cac:Party>
      <cac:PartyName><cbc:Name>IYT Corporation</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Avon Way</cbc:StreetName>
        <cbc:CityName>Bridgtow</cbc:CityName>
        <cbc:PostalZone>ZZ99 1ZZ</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>GB</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:Telephone>0127 2653214</cbc:Telephone>
        <cbc:ElectronicMail>fred@iytcorporation.gov.uk</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:BuyerCustomerParty>
  <cac:SellerSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Consortial</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Busy Street</cbc:StreetName>
        <cbc:CityName>Farthing</cbc:CityName>
        <cbc:PostalZone>AA99 1BB</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>GB</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>175 269 2355</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:SellerSupplierParty>
  <cac:OrderLine>
    <cac:LineItem>
      <cbc:Quantity unitCode="KGM">100</cbc:Quantity>
      <cbc:LineExtensionAmount currencyID="GBP">100.00</cbc:LineExtensionAmount>
      <cac:Price><cbc:PriceAmount currencyID="GBP">100.00</cbc:PriceAmount></cac:Price>
      <cac:Item><cbc:Description>Acme beeswax</cbc:Description></cac:Item>
    </cac:LineItem>
  </cac:OrderLine>
</Order>`;
const validUpdate = {
    customer: {
        id: "CUST-1",
        fullName: "Jane Doe",
        email: "jane@example.com",
        phone: "0400000000",
        billingAddress: {
            street: "123 New Street",
            city: "Sydney",
            postcode: "2000",
            country: "AU"
        },
        shippingAddress: {
            street: "123 New Street",
            city: "Sydney",
            postcode: "2000",
            country: "AU"
        }
    }
};
let token;
let invoiceId;
(0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.query('DELETE FROM invoices');
    yield datastore_1.default.query('DELETE FROM users');
    const testEmail = `test-${Date.now()}@gmail.com`;
    yield (0, auth_1.authRegister)(testEmail, 'correctpassword123');
    const loginRes = yield (0, auth_1.authLogin)(testEmail, 'correctpassword123');
    token = loginRes.token;
    const res = yield (0, supertest_1.default)(server_1.app)
        .post('/v1/invoices')
        .set('token', token)
        .set('Content-Type', 'application/xml')
        .send(validxml);
    invoiceId = JSON.parse(res.text).invoiceId;
}), 30000);
(0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.end();
}), 30000);
(0, globals_1.describe)('PUT /v1/invoices/:id', () => {
    (0, globals_1.test)('Successfully updates a draft invoice', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}`)
            .set('token', token)
            .send(validUpdate);
        (0, globals_1.expect)(res.body).toStrictEqual({ message: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
    }));
    (0, globals_1.test)('Successfully updates lineItems, currency, tax and from', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}`)
            .set('token', token)
            .send({
            lineItems: [{ description: 'New Item', quantity: 5, rate: 20 }],
            currency: 'USD',
            tax: { taxId: 'GST', countryCode: 'AU', taxPercentage: 10 },
            from: {
                businessName: 'New Business',
                address: { street: '789 New St', city: 'Brisbane', postcode: '4000', country: 'AU' },
                taxId: 'gst-789',
                abnNumber: '789',
                dueDate: new Date('2026-07-01')
            }
        });
        (0, globals_1.expect)(res.body).toStrictEqual({ message: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
    }));
    (0, globals_1.test)('Successfully updates invoice with no dueDate', () => __awaiter(void 0, void 0, void 0, function* () {
        const invoiceDataWithoutDueDate = {
            customer: {
                id: "CUST-1",
                fullName: "IYT Corporation",
                email: "fred@iytcorporation.gov.uk",
                phone: "0127 2653214",
                billingAddress: { street: "Avon Way", city: "Bridgtow", postcode: "ZZ99 1ZZ", country: "GB" },
                shippingAddress: { street: "Avon Way", city: "Bridgtow", postcode: "ZZ99 1ZZ", country: "GB" }
            },
            lineItems: [{ description: "Acme beeswax", quantity: 100, rate: 100 }],
            currency: "GBP",
            tax: { taxId: "GST", countryCode: "AU", taxPercentage: 10 },
            from: {
                businessName: "Consortial",
                address: { street: "Busy Street", city: "Farthing", postcode: "AA99 1BB", country: "GB" },
                taxId: "175 269 2355",
                abnNumber: "175 269 2355"
            }
        };
        yield datastore_1.default.query(`INSERT INTO invoices (invoiceId, userId, invoiceXML, invoiceData, status) VALUES ('22222222-2222-2222-2222-222222222222', (SELECT userId FROM users WHERE token = $1), 'xml', $2, 'Generated')`, [token, JSON.stringify(invoiceDataWithoutDueDate)]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/22222222-2222-2222-2222-222222222222`)
            .set('token', token)
            .send(validUpdate);
        (0, globals_1.expect)(res.body).toStrictEqual({ message: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
    }));
    (0, globals_1.test)('No token returns 401', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}`)
            .send(validUpdate);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Invalid token returns 401', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}`)
            .set('token', 'invalidtoken')
            .send(validUpdate);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Invoice with no data returns 404', () => __awaiter(void 0, void 0, void 0, function* () {
        yield datastore_1.default.query(`INSERT INTO invoices (invoiceId, userId, invoiceXML, status) VALUES ('11111111-1111-1111-1111-111111111111', (SELECT userId FROM users WHERE token = $1), 'xml', 'Generated')`, [token]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/11111111-1111-1111-1111-111111111111`)
            .set('token', token)
            .send(validUpdate);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(404);
    }));
    (0, globals_1.test)('Invoice not found returns 404', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/00000000-0000-0000-0000-000000000000`)
            .set('token', token)
            .send(validUpdate);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(404);
    }));
    (0, globals_1.test)('Wrong user returns 403', () => __awaiter(void 0, void 0, void 0, function* () {
        const otherEmail = `other-${Date.now()}@gmail.com`;
        yield (0, auth_1.authRegister)(otherEmail, 'correctpassword123');
        const otherLogin = yield (0, auth_1.authLogin)(otherEmail, 'correctpassword123');
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}`)
            .set('token', otherLogin.token)
            .send(validUpdate);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(403);
    }));
    (0, globals_1.test)('Finalised invoice returns 409', () => __awaiter(void 0, void 0, void 0, function* () {
        yield datastore_1.default.query(`UPDATE invoices SET status = 'Sent' WHERE invoiceId = $1`, [invoiceId]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}`)
            .set('token', token)
            .send(validUpdate);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(409);
    }));
    (0, globals_1.test)('Invalid update body returns 400', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}`)
            .set('token', token)
            .send({ customer: {
                fullName: '',
                email: '',
                phone: '',
                billingAddress: { street: '', city: '', postcode: '', country: '' },
                shippingAddress: { street: '', city: '', postcode: '', country: '' }
            } });
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
    }));
});
