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
const generator_1 = require("./generator");
const datastore_1 = __importDefault(require("../AWS/datastore"));
const auth_1 = require("../AWS/auth/auth");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const class_1 = require("../class");
(0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.query('DELETE FROM invoices');
    yield datastore_1.default.query('DELETE FROM users');
}), 10000);
(0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    yield datastore_1.default.end();
}), 10000);
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
const invalidxml = '<noxml>';
const noxml = '';
(0, globals_1.describe)("Invoice Generator", () => {
    (0, globals_1.test)("should generate an invoice XML", () => __awaiter(void 0, void 0, void 0, function* () {
        const testEmail = `test-${Date.now()}@gmail.com`;
        yield (0, auth_1.authRegister)(testEmail, 'correctpassword123');
        const tokenRes = yield (0, auth_1.authLogin)(testEmail, 'correctpassword123');
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/invoices')
            .set('token', tokenRes.token)
            .set('Content-Type', 'application/xml')
            .send(validxml);
        (0, globals_1.expect)(res.statusCode).toBe(201);
        (0, globals_1.expect)(res.body.message).toBe("Invoice generated successfully.");
        (0, globals_1.expect)(res.body.filePath).toBeDefined();
        (0, globals_1.expect)(res.body.invoiceId).toBeDefined();
    }));
    (0, globals_1.test)("should return 400 for invalid XML", () => __awaiter(void 0, void 0, void 0, function* () {
        const testEmail = `test-${Date.now()}@gmail.com`;
        yield (0, auth_1.authRegister)(testEmail, 'correctpassword123');
        const tokenRes = yield (0, auth_1.authLogin)(testEmail, 'correctpassword123');
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/invoices')
            .set('token', tokenRes.token)
            .set('Content-Type', 'application/xml')
            .send(invalidxml);
        (0, globals_1.expect)(res.statusCode).toBe(400);
        (0, globals_1.expect)(res.body.error).toBe("Invalid XML format.");
    }));
    (0, globals_1.test)("should return 400 for missing XML", () => __awaiter(void 0, void 0, void 0, function* () {
        const testEmail = `test-${Date.now()}@gmail.com`;
        yield (0, auth_1.authRegister)(testEmail, 'correctpassword123');
        const tokenRes = yield (0, auth_1.authLogin)(testEmail, 'correctpassword123');
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/invoices')
            .set('token', tokenRes.token)
            .set('Content-Type', 'application/xml')
            .send(noxml);
        (0, globals_1.expect)(res.statusCode).toBe(400);
        (0, globals_1.expect)(res.body.error).toBe("Invalid XML format.");
    }));
    (0, globals_1.test)("Not logged in", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server_1.app)
            .post('/v1/invoices')
            .set('Content-Type', 'application/xml')
            .send(validxml);
        (0, globals_1.expect)(res.statusCode).toBe(401);
        (0, globals_1.expect)(res.body.error).toBe("Not logged in.");
    }));
    (0, globals_1.test)("should generate invoice input json from xml", () => {
        const result = (0, generator_1.parseOrderXML)(validxml);
        (0, globals_1.expect)(result).toBeDefined();
        (0, globals_1.expect)(result.customer).toBeDefined();
        (0, globals_1.expect)(result.lineItems).toBeDefined();
        (0, globals_1.expect)(result.currency).toBeDefined();
        (0, globals_1.expect)(result.tax).toBeDefined();
        (0, globals_1.expect)(result.from).toBeDefined();
    });
    (0, globals_1.test)("should generate valid XML", () => {
        const input = {
            customer: {
                id: "CUST-1",
                fullName: "John Doe",
                email: "john@test.com",
                phone: "12345678",
                billingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" },
                shippingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" }
            },
            lineItems: [{ description: "Product A", quantity: 2, rate: 50 }],
            currency: "AUD",
            tax: { taxId: "GST", countryCode: "AU", taxPercentage: 10 },
            from: {
                businessName: "Test Business",
                address: { street: "123 Street", city: "Sydney", postcode: "2000", country: "AU" },
                taxId: "gst-123",
                abnNumber: "456",
                dueDate: new Date("2026-07-01")
            }
        };
        const xml = (0, generator_1.create_invoice)(input);
        (0, globals_1.expect)(xml).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        (0, globals_1.expect)(xml).toContain("John Doe");
        (0, globals_1.expect)(xml).toContain("Product A");
    });
    (0, globals_1.test)('should throw HttpError for invalid from details', () => {
        const invalidInput = {
            customer: {
                id: "CUST-1",
                fullName: "John Doe",
                email: "john@test.com",
                phone: "12345678",
                billingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" },
                shippingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" }
            },
            lineItems: [{ description: "Product A", quantity: 2, rate: 50 }],
            currency: "AUD",
            tax: { taxId: "GST", countryCode: "AU", taxPercentage: 10 },
            from: {
                businessName: '',
                address: { street: "123 Street", city: "Sydney", postcode: "2000", country: "AU" },
                taxId: "gst-123",
                abnNumber: "456",
                dueDate: new Date("2026-07-01")
            }
        };
        (0, globals_1.expect)(() => (0, generator_1.validateInvoiceInput)(invalidInput)).toThrow(class_1.HttpError);
    });
    (0, globals_1.test)('should throw HttpError for invalid line items', () => {
        const invalidInput = {
            customer: {
                id: "CUST-1",
                fullName: "John Doe",
                email: "john@test.com",
                phone: "12345678",
                billingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" },
                shippingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" }
            },
            lineItems: [],
            currency: "AUD",
            tax: { taxId: "GST", countryCode: "AU", taxPercentage: 10 },
            from: {
                businessName: "Test Business",
                address: { street: "123 Street", city: "Sydney", postcode: "2000", country: "AU" },
                taxId: "gst-123",
                abnNumber: "456",
                dueDate: new Date("2026-07-01")
            }
        };
        (0, globals_1.expect)(() => (0, generator_1.validateInvoiceInput)(invalidInput)).toThrow(class_1.HttpError);
    });
    (0, globals_1.test)('should throw HttpError for invalid currency', () => {
        const invalidInput = {
            customer: {
                id: "CUST-1",
                fullName: "John Doe",
                email: "john@test.com",
                phone: "12345678",
                billingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" },
                shippingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" }
            },
            lineItems: [{ description: "Product A", quantity: 2, rate: 50 }],
            currency: "INVALID",
            tax: { taxId: "GST", countryCode: "AU", taxPercentage: 10 },
            from: {
                businessName: "Test Business",
                address: { street: "123 Street", city: "Sydney", postcode: "2000", country: "AU" },
                taxId: "gst-123",
                abnNumber: "456",
                dueDate: new Date("2026-07-01")
            }
        };
        (0, globals_1.expect)(() => (0, generator_1.validateInvoiceInput)(invalidInput)).toThrow(class_1.HttpError);
    });
    (0, globals_1.test)('should throw HttpError for invalid tax', () => {
        const invalidInput = {
            customer: {
                id: "CUST-1",
                fullName: "John Doe",
                email: "john@test.com",
                phone: "12345678",
                billingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" },
                shippingAddress: { street: "456 Road", city: "Sydney", postcode: "2001", country: "AU" }
            },
            lineItems: [{ description: "Product A", quantity: 2, rate: 50 }],
            currency: "AUD",
            tax: { taxId: "", countryCode: "AU", taxPercentage: 10 },
            from: {
                businessName: "Test Business",
                address: { street: "123 Street", city: "Sydney", postcode: "2000", country: "AU" },
                taxId: "gst-123",
                abnNumber: "456",
                dueDate: new Date("2026-07-01")
            }
        };
        (0, globals_1.expect)(() => (0, generator_1.validateInvoiceInput)(invalidInput)).toThrow(class_1.HttpError);
    });
});
