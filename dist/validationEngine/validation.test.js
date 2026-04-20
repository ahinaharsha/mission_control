"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("../validationEngine/validation");
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('validateAddress', () => {
    (0, globals_1.test)('valid address returns no errors', () => {
        const result = (0, validation_1.validateAddress)({
            street: '123 Main St',
            city: 'Sydney',
            postcode: '2000',
            country: 'AU'
        });
        (0, globals_1.expect)(result).toStrictEqual([]);
    });
    (0, globals_1.test)('null address returns error', () => {
        const result = (0, validation_1.validateAddress)(null);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
        (0, globals_1.expect)(result[0].field).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(result[0].message).toStrictEqual(globals_1.expect.any(String));
    });
    (0, globals_1.test)('missing street returns error', () => {
        const result = (0, validation_1.validateAddress)({
            street: '',
            city: 'Sydney',
            postcode: '2000',
            country: 'AU'
        });
        (0, globals_1.expect)(result.some(e => e.field === 'street')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing city returns error', () => {
        const result = (0, validation_1.validateAddress)({
            street: '123 Main St',
            city: '',
            postcode: '2000',
            country: 'AU'
        });
        (0, globals_1.expect)(result.some(e => e.field === 'city')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing postcode returns error', () => {
        const result = (0, validation_1.validateAddress)({
            street: '123 Main St',
            city: 'Sydney',
            postcode: '',
            country: 'AU'
        });
        (0, globals_1.expect)(result.some(e => e.field === 'postcode')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing country returns error', () => {
        const result = (0, validation_1.validateAddress)({
            street: '123 Main St',
            city: 'Sydney',
            postcode: '2000',
            country: ''
        });
        (0, globals_1.expect)(result.some(e => e.field === 'country')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing from address street returns error', () => {
        const result = (0, validation_1.validateFromDetails)({
            businessName: 'ABC Electronics',
            address: {
                street: '',
                city: 'Sydney',
                postcode: '2000',
                country: 'AU'
            },
            taxId: 'ABN123456',
            abnNumber: '05959203020',
            dueDate: new Date('2026-07-01')
        });
        (0, globals_1.expect)(result.some(e => e.field === 'from.address.street')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
});
(0, globals_1.describe)('validateFromDetails', () => {
    (0, globals_1.test)('valid from details returns no errors', () => {
        const result = (0, validation_1.validateFromDetails)({
            businessName: 'ABC Electronics',
            address: {
                street: '14 Campbell St',
                city: 'Sydney',
                postcode: '2000',
                country: 'AU'
            },
            taxId: 'ABN123456',
            abnNumber: '05959203020',
            dueDate: new Date('2026-07-01')
        });
        (0, globals_1.expect)(result).toStrictEqual([]);
    });
    (0, globals_1.test)('null from returns error', () => {
        const result = (0, validation_1.validateFromDetails)(null);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
        (0, globals_1.expect)(result[0].field).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(result[0].message).toStrictEqual(globals_1.expect.any(String));
    });
    (0, globals_1.test)('missing businessName returns error', () => {
        const result = (0, validation_1.validateFromDetails)({
            businessName: '',
            address: {
                street: '14 Campbell St',
                city: 'Sydney',
                postcode: '2000',
                country: 'AU'
            },
            taxId: 'ABN123456',
            abnNumber: '05959203020',
            dueDate: new Date('2026-07-01')
        });
        (0, globals_1.expect)(result.some(e => e.field === 'from.businessName')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing taxId returns error', () => {
        const result = (0, validation_1.validateFromDetails)({
            businessName: 'ABC Electronics',
            address: {
                street: '14 Campbell St',
                city: 'Sydney',
                postcode: '2000',
                country: 'AU'
            },
            taxId: '',
            abnNumber: '05959203020',
            dueDate: new Date('2026-07-01')
        });
        (0, globals_1.expect)(result.some(e => e.field === 'from.taxId')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing abnNumber returns error', () => {
        const result = (0, validation_1.validateFromDetails)({
            businessName: 'ABC Electronics',
            address: {
                street: '14 Campbell St',
                city: 'Sydney',
                postcode: '2000',
                country: 'AU'
            },
            taxId: 'ABN123456',
            abnNumber: '',
            dueDate: new Date('2026-07-01')
        });
        (0, globals_1.expect)(result.some(e => e.field === 'from.abnNumber')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
});
(0, globals_1.describe)('validateCustomer', () => {
    (0, globals_1.test)('valid customer returns no errors', () => {
        const result = (0, validation_1.validateCustomer)({
            id: 'CUST-001',
            fullName: 'John Smith',
            email: 'john@gmail.com',
            phone: '+61400000000',
            billingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            },
            shippingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            }
        });
        (0, globals_1.expect)(result).toStrictEqual([]);
    });
    (0, globals_1.test)('null customer returns error', () => {
        const result = (0, validation_1.validateCustomer)(null);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
        (0, globals_1.expect)(result[0].field).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(result[0].message).toStrictEqual(globals_1.expect.any(String));
    });
    (0, globals_1.test)('missing fullName returns error', () => {
        const result = (0, validation_1.validateCustomer)({
            id: 'CUST-001',
            fullName: '',
            email: 'john@gmail.com',
            phone: '+61400000000',
            billingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            },
            shippingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            }
        });
        (0, globals_1.expect)(result.some(e => e.field === 'customer.fullName')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('invalid email returns error', () => {
        const result = (0, validation_1.validateCustomer)({
            id: 'CUST-001',
            fullName: 'John Smith',
            email: 'notanemail',
            phone: '+61400000000',
            billingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            },
            shippingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            }
        });
        (0, globals_1.expect)(result.some(e => e.field === 'customer.email')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing email returns error', () => {
        const result = (0, validation_1.validateCustomer)({
            id: 'CUST-001',
            fullName: 'John Smith',
            email: '',
            phone: '+61400000000',
            billingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            },
            shippingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            }
        });
        (0, globals_1.expect)(result.some(e => e.field === 'customer.email')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('invalid phone returns error', () => {
        const result = (0, validation_1.validateCustomer)({
            id: 'CUST-001',
            fullName: 'John Smith',
            email: 'john@gmail.com',
            phone: '123',
            billingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            },
            shippingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            }
        });
        (0, globals_1.expect)(result.some(e => e.field === 'customer.phone')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing billing address returns error', () => {
        const result = (0, validation_1.validateCustomer)({
            id: 'CUST-001',
            fullName: 'John Smith',
            email: 'john@gmail.com',
            phone: '+61400000000',
            billingAddress: null,
            shippingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            }
        });
        (0, globals_1.expect)(result.some(e => e.field === 'billingAddress.address')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing shipping address returns error', () => {
        const result = (0, validation_1.validateCustomer)({
            id: 'CUST-001',
            fullName: 'John Smith',
            email: 'john@gmail.com',
            phone: '+61400000000',
            billingAddress: {
                street: '25 King St',
                city: 'Melbourne',
                postcode: '3000',
                country: 'AU'
            },
            shippingAddress: null
        });
        (0, globals_1.expect)(result.some(e => e.field === 'shippingAddress.address')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
});
(0, globals_1.describe)('validateLineItems', () => {
    (0, globals_1.test)('valid line items returns no errors', () => {
        const result = (0, validation_1.validateLineItems)([{
                description: 'Laptop',
                quantity: 1,
                rate: 1000
            }]);
        (0, globals_1.expect)(result).toStrictEqual([]);
    });
    (0, globals_1.test)('empty array returns error', () => {
        const result = (0, validation_1.validateLineItems)([]);
        (0, globals_1.expect)(result.some(e => e.field === 'lineItems')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing description returns error', () => {
        const result = (0, validation_1.validateLineItems)([{
                description: '',
                quantity: 1,
                rate: 1000
            }]);
        (0, globals_1.expect)(result.some(e => e.field === 'lineItem[0].description')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('quantity of 0 returns error', () => {
        const result = (0, validation_1.validateLineItems)([{
                description: 'Laptop',
                quantity: 0,
                rate: 1000
            }]);
        (0, globals_1.expect)(result.some(e => e.field === 'lineItem[0].quantity')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('negative quantity returns error', () => {
        const result = (0, validation_1.validateLineItems)([{
                description: 'Laptop',
                quantity: -1,
                rate: 1000
            }]);
        (0, globals_1.expect)(result.some(e => e.field === 'lineItem[0].quantity')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('rate of 0 returns error', () => {
        const result = (0, validation_1.validateLineItems)([{
                description: 'Laptop',
                quantity: 1,
                rate: 0
            }]);
        (0, globals_1.expect)(result.some(e => e.field === 'lineItem[0].rate')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('negative rate returns error', () => {
        const result = (0, validation_1.validateLineItems)([{
                description: 'Laptop',
                quantity: 1,
                rate: -1
            }]);
        (0, globals_1.expect)(result.some(e => e.field === 'lineItem[0].rate')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
});
(0, globals_1.describe)('validateCurrency', () => {
    (0, globals_1.test)('valid currency returns no errors', () => {
        const result = (0, validation_1.validateCurrency)('AUD');
        (0, globals_1.expect)(result).toStrictEqual([]);
    });
    (0, globals_1.test)('invalid currency code returns error', () => {
        const result = (0, validation_1.validateCurrency)('invalid');
        (0, globals_1.expect)(result.some(e => e.field === 'currency')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('invalid base currency returns error', () => {
        const result = (0, validation_1.validateCurrency)('AUD', 1.5, 'invalid');
        (0, globals_1.expect)(result.some(e => e.field === 'baseCurrency')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing exchange rate when currencies differ returns error', () => {
        const result = (0, validation_1.validateCurrency)('AUD', undefined, 'USD');
        (0, globals_1.expect)(result.some(e => e.field === 'exchangeRate')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('valid currency with exchange rate returns no errors', () => {
        const result = (0, validation_1.validateCurrency)('AUD', 1.5, 'USD');
        (0, globals_1.expect)(result).toStrictEqual([]);
    });
});
(0, globals_1.describe)('validateTax', () => {
    (0, globals_1.test)('valid tax returns no errors', () => {
        const result = (0, validation_1.validateTax)({
            taxId: 'GST',
            countryCode: 'AU',
            taxPercentage: 10
        });
        (0, globals_1.expect)(result).toStrictEqual([]);
    });
    (0, globals_1.test)('null tax returns error', () => {
        const result = (0, validation_1.validateTax)(null);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
        (0, globals_1.expect)(result[0].field).toStrictEqual(globals_1.expect.any(String));
        (0, globals_1.expect)(result[0].message).toStrictEqual(globals_1.expect.any(String));
    });
    (0, globals_1.test)('missing taxId returns error', () => {
        const result = (0, validation_1.validateTax)({
            taxId: '',
            countryCode: 'AU',
            taxPercentage: 10
        });
        (0, globals_1.expect)(result.some(e => e.field === 'tax.taxId')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('missing countryCode returns error', () => {
        const result = (0, validation_1.validateTax)({
            taxId: 'GST',
            countryCode: '',
            taxPercentage: 10
        });
        (0, globals_1.expect)(result.some(e => e.field === 'tax.countryCode')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('negative taxPercentage returns error', () => {
        const result = (0, validation_1.validateTax)({
            taxId: 'GST',
            countryCode: 'AU',
            taxPercentage: -1
        });
        (0, globals_1.expect)(result.some(e => e.field === 'tax.taxPercentage')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
    (0, globals_1.test)('taxPercentage over 100 returns error', () => {
        const result = (0, validation_1.validateTax)({
            taxId: 'GST',
            countryCode: 'AU',
            taxPercentage: 101
        });
        (0, globals_1.expect)(result.some(e => e.field === 'tax.taxPercentage')).toBe(true);
        (0, globals_1.expect)(result.length).toBeGreaterThan(0);
    });
});
