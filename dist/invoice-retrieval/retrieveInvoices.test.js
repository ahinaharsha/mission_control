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
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const datastore_1 = __importDefault(require("../AWS/datastore"));
const auth_1 = require("../AWS/auth/auth");
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
let token;
let invoiceId;
(0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
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
(0, globals_1.describe)('GET /v1/invoices/:id', () => {
    (0, globals_1.test)('Returns invoice for valid invoiceId', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/${invoiceId}`)
            .set('token', token);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.invoiceId).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(res.body.userId).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(res.body.status).toStrictEqual(globals_1.expect.any(String));
    }));
    (0, globals_1.test)('Invoice not found returns 404', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/00000000-0000-0000-0000-000000000000`)
            .set('token', token);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(404);
    }));
    (0, globals_1.test)('No token returns 401', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/${invoiceId}`);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Invalid token returns 401', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/${invoiceId}`)
            .set('token', 'invalidtoken');
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
    }));
    (0, globals_1.test)('Wrong user returns 403', () => __awaiter(void 0, void 0, void 0, function* () {
        const otherEmail = `other-${Date.now()}@gmail.com`;
        yield (0, auth_1.authRegister)(otherEmail, 'correctpassword123');
        const otherLogin = yield (0, auth_1.authLogin)(otherEmail, 'correctpassword123');
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/${invoiceId}`)
            .set('token', otherLogin.token);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(403);
    }));
});
