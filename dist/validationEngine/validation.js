"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddress = validateAddress;
exports.validateFromDetails = validateFromDetails;
exports.validateCustomer = validateCustomer;
exports.validateLineItems = validateLineItems;
exports.validateCurrency = validateCurrency;
exports.validateTax = validateTax;
const validationHelpers_1 = require("./validationHelpers");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;
const ISO_CURRENCY_REGEX = /^[A-Z]{3}$/;
function validateAddress(address) {
    const errors = [];
    if (!address) {
        errors.push({ field: "address", message: "Address is required.", code: 400 });
        return errors;
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(address.street)) {
        errors.push({ field: "street", message: "Street is required.", code: 400 });
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(address.city)) {
        errors.push({ field: "city", message: "City is required.", code: 400 });
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(address.postcode)) {
        errors.push({ field: "postcode", message: "Postcode is required.", code: 400 });
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(address.country)) {
        errors.push({ field: "country", message: "Country is required.", code: 400 });
    }
    return errors;
}
function validateFromDetails(from) {
    const errors = [];
    if (!from) {
        errors.push({ field: "from", message: "Seller details are required.", code: 400 });
        return errors;
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(from.businessName)) {
        errors.push({ field: "from.businessName", message: "Business name is required.", code: 400 });
    }
    validateAddress(from.address).forEach(e => {
        errors.push(Object.assign(Object.assign({}, e), { field: `from.address.${e.field}` }));
    });
    if (!(0, validationHelpers_1.isNonEmptyString)(from.taxId)) {
        errors.push({ field: "from.taxId", message: "Tax ID is required.", code: 400 });
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(from.abnNumber)) {
        errors.push({ field: "from.abnNumber", message: "ABN number is required.", code: 400 });
    }
    return errors;
}
function validateCustomer(customer) {
    const errors = [];
    if (!customer) {
        errors.push({ field: "customer", message: "Customer information is required.", code: 400 });
        return errors;
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(customer.fullName)) {
        errors.push({ field: "customer.fullName", message: "Customer full name is required.", code: 400 });
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(customer.email) || !EMAIL_REGEX.test(customer.email)) {
        errors.push({ field: "customer.email", message: "A valid customer email address is required.", code: 400 });
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(customer.phone) || !PHONE_REGEX.test(customer.phone)) {
        errors.push({ field: "customer.phone", message: "A valid customer phone number is required.", code: 400 });
    }
    validateAddress(customer.billingAddress).forEach(e => {
        errors.push(Object.assign(Object.assign({}, e), { field: `billingAddress.${e.field}` }));
    });
    validateAddress(customer.shippingAddress).forEach(e => {
        errors.push(Object.assign(Object.assign({}, e), { field: `shippingAddress.${e.field}` }));
    });
    return errors;
}
function validateLineItems(lineItem) {
    const errors = [];
    if (lineItem.length === 0) {
        errors.push({ field: "lineItems", message: "At least one line item is required.", code: 400 });
        return errors;
    }
    lineItem.forEach((item, index) => {
        const i = `lineItem[${index}]`;
        if (!(0, validationHelpers_1.isNonEmptyString)(item.description)) {
            errors.push({ field: `${i}.description`, message: "Item description is required.", code: 400 });
        }
        if (item.quantity <= 0) {
            errors.push({ field: `${i}.quantity`, message: "Item quantity must be a positive number.", code: 400 });
        }
        if (item.rate <= 0) {
            errors.push({ field: `${i}.rate`, message: "Item rate (unit price) must be a positive number.", code: 400 });
        }
    });
    return errors;
}
function validateCurrency(currency, exchangeRate, baseCurrency) {
    const errors = [];
    if (!ISO_CURRENCY_REGEX.test(currency)) {
        errors.push({ field: "currency", message: "Currency must be a valid ISO 4217 code.", code: 400 });
    }
    if (baseCurrency !== undefined && baseCurrency !== currency) {
        if (!ISO_CURRENCY_REGEX.test(baseCurrency)) {
            errors.push({ field: "baseCurrency", message: "Base currency must be a valid ISO 4217 code.", code: 400 });
        }
        if (!exchangeRate || exchangeRate <= 0) {
            errors.push({
                field: "exchangeRate",
                message: `Exchange rate is required when (${currency}) differs from (${baseCurrency}).`,
                code: 400
            });
        }
    }
    return errors;
}
function validateTax(tax) {
    const errors = [];
    if (!tax) {
        errors.push({ field: "tax", message: "Tax details are required.", code: 400 });
        return errors;
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(tax.taxId)) {
        errors.push({ field: "tax.taxId", message: "Tax ID is required.", code: 400 });
    }
    if (!(0, validationHelpers_1.isNonEmptyString)(tax.countryCode)) {
        errors.push({ field: "tax.countryCode", message: "Country code is required for tax compliance.", code: 400 });
    }
    if (tax.taxPercentage < 0 || tax.taxPercentage > 100) {
        errors.push({ field: "tax.taxPercentage", message: "Tax percentage must be a number between 0 and 100.", code: 400 });
    }
    return errors;
}
