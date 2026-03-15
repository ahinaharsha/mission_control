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
const retrieveInvoices_1 = require("../invoice-retrieval/retrieveInvoices");
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
jest.mock('../AWS/datastore', () => ({
    query: jest.fn(),
}));
describe('retrieveInvoices', () => {
    const mockUserId = "user123";
    const mockDBRows = [
        {
            invoiceid: "inv001",
            userid: "user123",
            xml: {
                id: "inv001",
                customer: {
                    fullName: "John Doe",
                    email: "user@example.com",
                    phone: "0400000000",
                    billingAddress: {
                        street: "123 Street",
                        city: "Sydney",
                        postcode: "2000",
                        country: "Australia"
                    },
                    shippingAddress: {
                        street: "123 Street",
                        city: "Sydney",
                        postcode: "2000",
                        country: "Australia"
                    }
                },
                currency: "AUD",
                subtotal: 100,
                taxAmount: 10,
                totalAmount: 110,
                status: "DRAFT"
            },
            status: "DRAFT"
        }
    ];
    test('valid userId returns invoices', () => __awaiter(void 0, void 0, void 0, function* () {
        datastore_1.default.query.mockResolvedValue({
            rows: mockDBRows
        });
        const result = yield (0, retrieveInvoices_1.retrieveInvoices)(mockUserId);
        expect(datastore_1.default.query).toHaveBeenCalledWith('SELECT invoiceId, userId, invoiceXML as xml, status FROM invoices WHERE userId = $1', [mockUserId]);
        expect(result.length).toBe(1);
        expect(result[0].invoiceId).toStrictEqual(expect.any(String));
        expect(result[0].userId).toStrictEqual(expect.any(String));
        expect(result[0].status).toStrictEqual(expect.any(String));
    }));
    test('no invoices returns empty array', () => __awaiter(void 0, void 0, void 0, function* () {
        datastore_1.default.query.mockResolvedValue({
            rows: []
        });
        const result = yield (0, retrieveInvoices_1.retrieveInvoices)(mockUserId);
        expect(result).toStrictEqual([]);
    }));
    test('database error throws HttpError', () => __awaiter(void 0, void 0, void 0, function* () {
        datastore_1.default.query.mockRejectedValue(new Error("DB Error"));
        yield expect((0, retrieveInvoices_1.retrieveInvoices)(mockUserId))
            .rejects
            .toBeInstanceOf(class_1.HttpError);
    }));
});
