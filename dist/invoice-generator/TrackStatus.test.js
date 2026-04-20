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
const TrackStatus_1 = require("./TrackStatus");
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const datastore_1 = __importDefault(require("../AWS/datastore"));
const auth_1 = require("../AWS/auth/auth");
const validxml = `<?xml version="1.0" encoding="UTF-8"?>
<Order xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns="urn:oasis:names:specification:ubl:schema:xsd:Order-2">
	<cbc:UBLVersionID>2.0</cbc:UBLVersionID>
	<cbc:CustomizationID>urn:oasis:names:specification:ubl:xpath:Order-2.0:sbs-1.0-draft</cbc:CustomizationID>
	<cbc:ProfileID>bpid:urn:oasis:names:draft:bpss:ubl-2-sbs-order-with-simple-response-draft</cbc:ProfileID>
	<cbc:ID>AEG012345</cbc:ID>
	<cbc:SalesOrderID>CON0095678</cbc:SalesOrderID>
	<cbc:CopyIndicator>false</cbc:CopyIndicator>
	<cbc:UUID>6E09886B-DC6E-439F-82D1-7CCAC7F4E3B1</cbc:UUID>
	<cbc:IssueDate>2005-06-20</cbc:IssueDate>
	<cbc:DueDate>2025-06-20</cbc:DueDate>
	<cbc:Note>sample</cbc:Note>
	<cac:BuyerCustomerParty>
		<cbc:CustomerAssignedAccountID>XFB01</cbc:CustomerAssignedAccountID>
		<cbc:SupplierAssignedAccountID>GT00978567</cbc:SupplierAssignedAccountID>
		<cac:Party>
			<cac:PartyName>
				<cbc:Name>IYT Corporation</cbc:Name>
			</cac:PartyName>
			<cac:PostalAddress>
				<cbc:StreetName>Avon Way</cbc:StreetName>
				<cbc:BuildingName>Thereabouts</cbc:BuildingName>
				<cbc:BuildingNumber>56A</cbc:BuildingNumber>
				<cbc:CityName>Bridgtow</cbc:CityName>
				<cbc:PostalZone>ZZ99 1ZZ</cbc:PostalZone>
				<cbc:CountrySubentity>Avon</cbc:CountrySubentity>
				<cac:AddressLine>
					<cbc:Line>3rd Floor, Room 5</cbc:Line>
				</cac:AddressLine>
				<cac:Country>
					<cbc:IdentificationCode>GB</cbc:IdentificationCode>
				</cac:Country>
			</cac:PostalAddress>
			<cac:PartyTaxScheme>
				<cbc:RegistrationName>Bridgtow District Council</cbc:RegistrationName>
				<cbc:CompanyID>12356478</cbc:CompanyID>
				<cbc:ExemptionReason>Local Authority</cbc:ExemptionReason>
				<cac:TaxScheme>
					<cbc:ID>UK VAT</cbc:ID>
					<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:PartyTaxScheme>
			<cac:Contact>
				<cbc:Name>Mr Fred Churchill</cbc:Name>
				<cbc:Telephone>0127 2653214</cbc:Telephone>
				<cbc:Telefax>0127 2653215</cbc:Telefax>
				<cbc:ElectronicMail>fred@iytcorporation.gov.uk</cbc:ElectronicMail>
			</cac:Contact>
		</cac:Party>
	</cac:BuyerCustomerParty>
	<cac:SellerSupplierParty>
		<cbc:CustomerAssignedAccountID>CO001</cbc:CustomerAssignedAccountID>
		<cac:Party>
			<cac:PartyName>
				<cbc:Name>Consortial</cbc:Name>
			</cac:PartyName>
			<cac:PostalAddress>
				<cbc:StreetName>Busy Street</cbc:StreetName>
				<cbc:BuildingName>Thereabouts</cbc:BuildingName>
				<cbc:BuildingNumber>56A</cbc:BuildingNumber>
				<cbc:CityName>Farthing</cbc:CityName>
				<cbc:PostalZone>AA99 1BB</cbc:PostalZone>
				<cbc:CountrySubentity>Heremouthshire</cbc:CountrySubentity>
				<cac:AddressLine>
					<cbc:Line>The Roundabout</cbc:Line>
				</cac:AddressLine>
				<cac:Country>
					<cbc:IdentificationCode>GB</cbc:IdentificationCode>
				</cac:Country>
			</cac:PostalAddress>
			<cac:PartyTaxScheme>
				<cbc:RegistrationName>Farthing Purchasing Consortium</cbc:RegistrationName>
				<cbc:CompanyID>175 269 2355</cbc:CompanyID>
				<cbc:ExemptionReason>N/A</cbc:ExemptionReason>
				<cac:TaxScheme>
					<cbc:ID>VAT</cbc:ID>
					<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:PartyTaxScheme>
			<cac:Contact>
				<cbc:Name>Mrs Bouquet</cbc:Name>
				<cbc:Telephone>0158 1233714</cbc:Telephone>
				<cbc:Telefax>0158 1233856</cbc:Telefax>
				<cbc:ElectronicMail>bouquet@fpconsortial.co.uk</cbc:ElectronicMail>
			</cac:Contact>
		</cac:Party>
	</cac:SellerSupplierParty>
	<cac:OriginatorCustomerParty>
		<cac:Party>
			<cac:PartyName>
				<cbc:Name>The Terminus</cbc:Name>
			</cac:PartyName>
			<cac:PostalAddress>
				<cbc:StreetName>Avon Way</cbc:StreetName>
				<cbc:BuildingName>Thereabouts</cbc:BuildingName>
				<cbc:BuildingNumber>56A</cbc:BuildingNumber>
				<cbc:CityName>Bridgtow</cbc:CityName>
				<cbc:PostalZone>ZZ99 1ZZ</cbc:PostalZone>
				<cbc:CountrySubentity>Avon</cbc:CountrySubentity>
				<cac:AddressLine>
					<cbc:Line>3rd Floor, Room 5</cbc:Line>
				</cac:AddressLine>
				<cac:Country>
					<cbc:IdentificationCode>GB</cbc:IdentificationCode>
				</cac:Country>
			</cac:PostalAddress>
			<cac:PartyTaxScheme>
				<cbc:RegistrationName>Bridgtow District Council</cbc:RegistrationName>
				<cbc:CompanyID>12356478</cbc:CompanyID>
				<cbc:ExemptionReason>Local Authority</cbc:ExemptionReason>
				<cac:TaxScheme>
					<cbc:ID>UK VAT</cbc:ID>
					<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
				</cac:TaxScheme>
			</cac:PartyTaxScheme>
			<cac:Contact>
				<cbc:Name>S Massiah</cbc:Name>
				<cbc:Telephone>0127 98876545</cbc:Telephone>
				<cbc:Telefax>0127 98876546</cbc:Telefax>
				<cbc:ElectronicMail>smassiah@the-email.co.uk</cbc:ElectronicMail>
			</cac:Contact>
		</cac:Party>
	</cac:OriginatorCustomerParty>
	<cac:Delivery>
		<cac:DeliveryAddress>
			<cbc:StreetName>Avon Way</cbc:StreetName>
			<cbc:BuildingName>Thereabouts</cbc:BuildingName>
			<cbc:BuildingNumber>56A</cbc:BuildingNumber>
			<cbc:CityName>Bridgtow</cbc:CityName>
			<cbc:PostalZone>ZZ99 1ZZ</cbc:PostalZone>
			<cbc:CountrySubentity>Avon</cbc:CountrySubentity>
			<cac:AddressLine>
				<cbc:Line>3rd Floor, Room 5</cbc:Line>
			</cac:AddressLine>
			<cac:Country>
				<cbc:IdentificationCode>GB</cbc:IdentificationCode>
			</cac:Country>
		</cac:DeliveryAddress>
		<cac:RequestedDeliveryPeriod>
			<cbc:StartDate>2005-06-29</cbc:StartDate>
			<cbc:StartTime>09:30:47.0Z</cbc:StartTime>
			<cbc:EndDate>2005-06-29</cbc:EndDate>
			<cbc:EndTime>09:30:47.0Z</cbc:EndTime>
		</cac:RequestedDeliveryPeriod>
	</cac:Delivery>
	<cac:DeliveryTerms>
		<cbc:SpecialTerms>1% deduction for late delivery as per contract</cbc:SpecialTerms>
	</cac:DeliveryTerms>
	<cac:TransactionConditions>
		<cbc:Description>order response required; payment is by BACS or by cheque</cbc:Description>
	</cac:TransactionConditions>
	<cac:AnticipatedMonetaryTotal>
		<cbc:LineExtensionAmount currencyID="GBP">100.00</cbc:LineExtensionAmount>
		<cbc:PayableAmount currencyID="GBP">100.00</cbc:PayableAmount>
	</cac:AnticipatedMonetaryTotal>
	<cac:OrderLine>
		<cbc:Note>this is an illustrative order line</cbc:Note>
		<cac:LineItem>
			<cbc:ID>1</cbc:ID>
			<cbc:SalesOrderID>A</cbc:SalesOrderID>
			<cbc:LineStatusCode>NoStatus</cbc:LineStatusCode>
			<cbc:Quantity unitCode="KGM">100</cbc:Quantity>
			<cbc:LineExtensionAmount currencyID="GBP">100.00</cbc:LineExtensionAmount>
			<cbc:TotalTaxAmount currencyID="GBP">17.50</cbc:TotalTaxAmount>
			<cac:Price>
				<cbc:PriceAmount currencyID="GBP">100.00</cbc:PriceAmount>
				<cbc:BaseQuantity unitCode="KGM">1</cbc:BaseQuantity>
			</cac:Price>
			<cac:Item>
				<cbc:Description>Acme beeswax</cbc:Description>
				<cbc:Name>beeswax</cbc:Name>
				<cac:BuyersItemIdentification>
					<cbc:ID>6578489</cbc:ID>
				</cac:BuyersItemIdentification>
				<cac:SellersItemIdentification>
					<cbc:ID>17589683</cbc:ID>
				</cac:SellersItemIdentification>
			</cac:Item>
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
    // Create an invoice to test with
    yield (0, supertest_1.default)(server_1.app)
        .post('/v1/invoices')
        .set('token', token)
        .set('Content-Type', 'application/xml')
        .send(validxml);
    const result = yield datastore_1.default.query(`SELECT invoiceId FROM invoices ORDER BY invoiceId DESC LIMIT 1`);
    invoiceId = result.rows[0].invoiceid;
}), 30000);
(0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.end();
}), 30000);
(0, globals_1.describe)('getstatus', () => {
    (0, globals_1.test)('should return the status of an existing invoice', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/${invoiceId}/status`)
            .set('token', token)
            .set('invoiceId', invoiceId);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.status).toBe('Overdue');
    }));
    (0, globals_1.test)('should return 404 for non-existent invoice', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/00000000-0000-0000-0000-000000000000/status`)
            .set('token', token)
            .set('invoiceId', '00000000-0000-0000-0000-000000000000');
        (0, globals_1.expect)(res.statusCode).toStrictEqual(404);
    }));
    (0, globals_1.test)('should handle invoice with missing due date', () => __awaiter(void 0, void 0, void 0, function* () {
        yield datastore_1.default.query(`INSERT INTO invoices (invoiceId, userId, invoiceXML, status) VALUES ('44444444-4444-4444-4444-444444444444', (SELECT userId FROM users WHERE token = $1), $2, 'Generated')`, [token, `<?xml version="1.0" encoding="UTF-8"?><Invoice></Invoice>`]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/44444444-4444-4444-4444-444444444444/status`)
            .set('token', token);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
    }));
    (0, globals_1.test)('should handle invoice with empty due date tag', () => __awaiter(void 0, void 0, void 0, function* () {
        yield datastore_1.default.query(`INSERT INTO invoices (invoiceId, userId, invoiceXML, status) VALUES ('55555555-5555-5555-5555-555555555555', (SELECT userId FROM users WHERE token = $1), $2, 'Generated')`, [token, `<?xml version="1.0" encoding="UTF-8"?><Invoice><cbc:DueDate></cbc:DueDate></Invoice>`]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/55555555-5555-5555-5555-555555555555/status`)
            .set('token', token);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
    }));
    (0, globals_1.test)('should return 401 for no token on get status', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/${invoiceId}/status`);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
    }));
    (0, globals_1.test)('should return 401 for no token on update status', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}/status`)
            .send({ status: 'Paid' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(401);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
    }));
    (0, globals_1.test)('should return immediately if status is already Overdue', () => __awaiter(void 0, void 0, void 0, function* () {
        yield datastore_1.default.query(`INSERT INTO invoices (invoiceId, userId, invoiceXML, status) VALUES ('66666666-6666-6666-6666-666666666666', (SELECT userId FROM users WHERE token = $1), $2, 'Overdue')`, [token, `<?xml version="1.0" encoding="UTF-8"?><Invoice><cbc:DueDate>2020-01-01</cbc:DueDate></Invoice>`]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/66666666-6666-6666-6666-666666666666/status`)
            .set('token', token);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.status).toBe('Overdue');
    }));
    (0, globals_1.test)('should return 403 for invoice belonging to another user', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a second user and invoice
        const testEmail2 = `test2-${Date.now()}@gmail.com`;
        yield (0, auth_1.authRegister)(testEmail2, 'correctpassword123');
        const loginRes2 = yield (0, auth_1.authLogin)(testEmail2, 'correctpassword123');
        const token2 = loginRes2.token;
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/${invoiceId}/status`)
            .set('token', token2)
            .set('invoiceId', invoiceId);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(403);
        (0, globals_1.expect)(res.body.error).toBe('Forbidden.');
    }));
    (0, globals_1.test)('should return overdue if invoice is past due date and not paid', () => __awaiter(void 0, void 0, void 0, function* () {
        // Update the invoice in the database to have a past due date
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/${invoiceId}/status`)
            .set('token', token)
            .set('invoiceId', invoiceId);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.status).toBe('Overdue');
    }));
    (0, globals_1.test)('should set status to Overdue if due date has passed', () => __awaiter(void 0, void 0, void 0, function* () {
        yield datastore_1.default.query(`INSERT INTO invoices (invoiceId, userId, invoiceXML, status) VALUES ('77777777-7777-7777-7777-777777777777', (SELECT userId FROM users WHERE token = $1), $2, 'Generated')`, [token, `<?xml version="1.0" encoding="UTF-8"?><Invoice><cbc:DueDate>2020-01-01</cbc:DueDate></Invoice>`]);
        const res = yield (0, supertest_1.default)(server_1.app)
            .get(`/v1/invoices/77777777-7777-7777-7777-777777777777/status`)
            .set('token', token);
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        (0, globals_1.expect)(res.body.status).toBe('Overdue');
    }));
});
(0, globals_1.describe)('UpdateStatus', () => {
    (0, globals_1.test)('should update the status of an existing invoice', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}/status`)
            .set('token', token)
            .set('invoiceId', invoiceId)
            .send({ status: 'Paid' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(200);
        const status = yield (0, TrackStatus_1.getStatus)(invoiceId, token);
        (0, globals_1.expect)(status).toBe('Paid');
    }));
    (0, globals_1.test)('should return 400 for invalid status value', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}/status`)
            .set('token', token)
            .send({ status: 'InvalidStatus' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(400);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
    }));
    (0, globals_1.test)('should return 404 for non-existent invoice', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/00000000-0000-0000-0000-000000000000/status`)
            .set('token', token)
            .set('invoiceId', '00000000-0000-0000-0000-000000000000')
            .send({ status: 'Paid' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(404);
        const status = yield (0, TrackStatus_1.getStatus)(invoiceId, token);
        (0, globals_1.expect)(status).toBe('Paid');
    }));
    (0, globals_1.test)('should return 403 for invoice belonging to another user on update status', () => __awaiter(void 0, void 0, void 0, function* () {
        const otherEmail = `other-${Date.now()}@gmail.com`;
        yield (0, auth_1.authRegister)(otherEmail, 'correctpassword123');
        const otherLogin = yield (0, auth_1.authLogin)(otherEmail, 'correctpassword123');
        const res = yield (0, supertest_1.default)(server_1.app)
            .put(`/v1/invoices/${invoiceId}/status`)
            .set('token', otherLogin.token)
            .send({ status: 'Paid' });
        (0, globals_1.expect)(res.statusCode).toStrictEqual(403);
        (0, globals_1.expect)(res.body).toStrictEqual({ error: globals_1.expect.any(String) });
    }));
});
