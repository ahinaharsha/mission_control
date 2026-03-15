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
exports.parseOrderXML = parseOrderXML;
exports.validateInvoiceInput = validateInvoiceInput;
exports.create_invoice = create_invoice;
exports.generateInvoice = generateInvoice;
const xml_js_1 = require("xml-js");
const validation_1 = require("../validationEngine/validation");
const class_1 = require("../class");
const peppol_toolkit_1 = require("@pixeldrive/peppol-toolkit");
const uuid_1 = require("uuid");
const datastore_1 = __importDefault(require("../AWS/datastore"));
function parseOrderXML(xml) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    const parsed = (0, xml_js_1.xml2js)(xml, { compact: true });
    const order = parsed.Order;
    const buyerParty = order["cac:BuyerCustomerParty"]["cac:Party"];
    const sellerParty = order["cac:SellerSupplierParty"]["cac:Party"];
    const billingAddress = buyerParty["cac:PostalAddress"];
    const orderLine = order["cac:OrderLine"]["cac:LineItem"];
    const invoiceInput = {
        customer: {
            id: (_a = order["cac:BuyerCustomerParty"]["cbc:CustomerAssignedAccountID"]) === null || _a === void 0 ? void 0 : _a._text,
            fullName: ((_b = buyerParty["cac:PartyName"]["cbc:Name"]) === null || _b === void 0 ? void 0 : _b._text) || "Unknown",
            email: ((_d = (_c = buyerParty["cac:Contact"]) === null || _c === void 0 ? void 0 : _c["cbc:ElectronicMail"]) === null || _d === void 0 ? void 0 : _d._text) || "",
            phone: ((_f = (_e = buyerParty["cac:Contact"]) === null || _e === void 0 ? void 0 : _e["cbc:Telephone"]) === null || _f === void 0 ? void 0 : _f._text) || "",
            billingAddress: {
                street: (_g = billingAddress["cbc:StreetName"]) === null || _g === void 0 ? void 0 : _g._text,
                city: (_h = billingAddress["cbc:CityName"]) === null || _h === void 0 ? void 0 : _h._text,
                postcode: (_j = billingAddress["cbc:PostalZone"]) === null || _j === void 0 ? void 0 : _j._text,
                country: (_k = billingAddress["cac:Country"]["cbc:IdentificationCode"]) === null || _k === void 0 ? void 0 : _k._text
            },
            shippingAddress: {
                street: (_l = billingAddress["cbc:StreetName"]) === null || _l === void 0 ? void 0 : _l._text,
                city: (_m = billingAddress["cbc:CityName"]) === null || _m === void 0 ? void 0 : _m._text,
                postcode: (_o = billingAddress["cbc:PostalZone"]) === null || _o === void 0 ? void 0 : _o._text,
                country: (_p = billingAddress["cac:Country"]["cbc:IdentificationCode"]) === null || _p === void 0 ? void 0 : _p._text
            }
        },
        lineItems: [
            {
                description: (_q = orderLine["cac:Item"]["cbc:Description"]) === null || _q === void 0 ? void 0 : _q._text,
                quantity: Number((_r = orderLine["cbc:Quantity"]) === null || _r === void 0 ? void 0 : _r._text),
                rate: Number((_s = orderLine["cac:Price"]["cbc:PriceAmount"]) === null || _s === void 0 ? void 0 : _s._text)
            }
        ],
        currency: ((_u = (_t = orderLine["cbc:LineExtensionAmount"]) === null || _t === void 0 ? void 0 : _t._attributes) === null || _u === void 0 ? void 0 : _u.currencyID) || "AUD",
        tax: {
            taxId: "GST",
            countryCode: "AU",
            taxPercentage: 10
        },
        from: {
            businessName: (_v = sellerParty["cac:PartyName"]["cbc:Name"]) === null || _v === void 0 ? void 0 : _v._text,
            taxId: ((_x = (_w = sellerParty["cac:PartyTaxScheme"]) === null || _w === void 0 ? void 0 : _w["cbc:CompanyID"]) === null || _x === void 0 ? void 0 : _x._text) || "",
            abnNumber: ((_z = (_y = sellerParty["cac:PartyTaxScheme"]) === null || _y === void 0 ? void 0 : _y["cbc:CompanyID"]) === null || _z === void 0 ? void 0 : _z._text) || "",
            address: {
                street: (_0 = sellerParty["cac:PostalAddress"]["cbc:StreetName"]) === null || _0 === void 0 ? void 0 : _0._text,
                city: (_1 = sellerParty["cac:PostalAddress"]["cbc:CityName"]) === null || _1 === void 0 ? void 0 : _1._text,
                postcode: (_2 = sellerParty["cac:PostalAddress"]["cbc:PostalZone"]) === null || _2 === void 0 ? void 0 : _2._text,
                country: (_3 = sellerParty["cac:PostalAddress"]["cac:Country"]["cbc:IdentificationCode"]) === null || _3 === void 0 ? void 0 : _3._text
            },
            dueDate: new Date()
        }
    };
    return invoiceInput;
}
function validateInvoiceInput(input) {
    const customerErrors = (0, validation_1.validateCustomer)(input.customer);
    if (customerErrors.length > 0) {
        throw new class_1.HttpError(JSON.stringify(customerErrors), 400);
    }
    const fromErrors = (0, validation_1.validateFromDetails)(input.from);
    if (fromErrors.length > 0) {
        throw new class_1.HttpError(JSON.stringify(fromErrors), 400);
    }
    const lineItemErrors = (0, validation_1.validateLineItems)(input.lineItems);
    if (lineItemErrors.length > 0) {
        throw new class_1.HttpError(JSON.stringify(lineItemErrors), 400);
    }
    const currencyErrors = (0, validation_1.validateCurrency)(input.currency);
    if (currencyErrors.length > 0) {
        throw new class_1.HttpError(JSON.stringify(currencyErrors), 400);
    }
    const taxErrors = (0, validation_1.validateTax)(input.tax);
    if (taxErrors.length > 0) {
        throw new class_1.HttpError(JSON.stringify(taxErrors), 400);
    }
}
function create_invoice(input) {
    var _a;
    const toolkit = new peppol_toolkit_1.PeppolToolkit();
    const subtotal = input.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = subtotal * (input.tax.taxPercentage / 100);
    const total = subtotal + taxAmount;
    const invoiceData = {
        ID: `INV-${Date.now()}`,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: (_a = input.from.dueDate) === null || _a === void 0 ? void 0 : _a.toISOString().split("T")[0],
        invoiceTypeCode: 380,
        documentCurrencyCode: input.currency,
        buyerReference: "PO-001",
        seller: {
            endPoint: { scheme: "ABN", id: String(input.from.abnNumber) },
            legalEntity: {
                registrationName: input.from.businessName,
                companyId: input.from.taxId,
            },
            name: input.from.businessName,
            address: {
                streetName: input.from.address.street,
                cityName: input.from.address.city,
                postalZone: input.from.address.postcode,
                country: input.from.address.country,
            },
            taxSchemeCompanyID: input.from.taxId,
            identification: [{ id: input.from.taxId }],
        },
        buyer: {
            endPoint: { scheme: "EMAIL", id: input.customer.email },
            legalEntity: {
                registrationName: input.customer.fullName,
                companyId: input.customer.fullName,
            },
            name: input.customer.fullName,
            address: {
                streetName: input.customer.billingAddress.street,
                cityName: input.customer.billingAddress.city,
                postalZone: input.customer.billingAddress.postcode,
                country: input.customer.billingAddress.country,
            },
            taxSchemeCompanyID: "N/A",
            identification: [{ id: input.customer.fullName }],
        },
        paymentMeans: [
            {
                code: "30",
                paymentId: `INV-${Date.now()}`,
                name: "Bank Transfer",
                financialAccount: {
                    id: "UNKNOWN",
                    name: input.from.businessName,
                    financialInstitutionBranch: "UNKNOWN",
                },
            },
        ],
        paymentTermsNote: "Payment due within 30 days",
        taxTotal: [
            {
                taxAmountCurrency: input.currency,
                taxAmount: taxAmount,
                subTotals: [
                    {
                        taxableAmount: subtotal,
                        taxAmount: taxAmount,
                        taxCategory: {
                            categoryCode: "S",
                            percent: input.tax.taxPercentage,
                        },
                    },
                ],
            },
        ],
        legalMonetaryTotal: {
            currency: input.currency,
            lineExtensionAmount: subtotal,
            taxExclusiveAmount: subtotal,
            taxInclusiveAmount: total,
            prepaidAmount: 0,
            payableAmount: total,
        },
        invoiceLines: input.lineItems.map((item, index) => ({
            id: String(index + 1),
            invoicedQuantity: item.quantity,
            unitCode: "EA",
            lineExtensionAmount: item.quantity * item.rate,
            price: item.rate,
            name: item.description,
            currency: input.currency,
            taxCategory: {
                categoryCode: "S",
                percent: input.tax.taxPercentage,
            },
        })),
    };
    return toolkit.invoiceToPeppolUBL(invoiceData);
}
function generateInvoice(xml, token) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            throw new class_1.HttpError('Not logged in.', 401);
        }
        const input = parseOrderXML(xml);
        try {
            validateInvoiceInput(input);
        }
        catch (error) {
            return {
                message: error.message,
                code: error.statusCode || 500
            };
        }
        const invoiceXML = create_invoice(input);
        const invoiceNumber = `INV-${Date.now()}`;
        const invoiceId = (0, uuid_1.v4)();
        const userResult = yield datastore_1.default.query(`SELECT userId FROM users WHERE token = $1`, [token]);
        const userId = userResult.rows[0].userId;
        console.log("User ID from token:", userId);
        const result = yield datastore_1.default.query(`INSERT INTO invoices (invoiceId, userId, invoiceXML, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [invoiceId, userId, invoiceXML, 'generated']);
        // const invoiceResult = await pool.query(
        //   'SELECT * FROM invoices WHERE "userId" = $2 ORDER BY "createdAt" DESC LIMIT 1',
        //   [userId]
        // );
        return {
            output: invoiceXML,
            message: "Invoice generated successfully.",
            code: 200
        };
    });
}
