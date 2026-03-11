import { Address, ValidationError, FromDetails, CustomerInformation, TaxDetails, LineItem } from "../interface";
import { isNonEmptyString } from "../src/helpers/validationHelpers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;
const ISO_CURRENCY_REGEX = /^[A-Z]{3}$/;

export function validateAddress(address: Address): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!address) {
    errors.push({ field: "address", message: "Address is required." });
    return errors;
  }

  if (!isNonEmptyString(address.street)) {
    errors.push({ field: "street", message: "Street is required." });
  }

  if (!isNonEmptyString(address.city)) {
    errors.push({ field: "city", message: "City is required." });
  }

  if (!isNonEmptyString(address.postcode)) {
    errors.push({ field: "postcode", message: "Postcode is required." });
  }

  if (!isNonEmptyString(address.country)) {
    errors.push({ field: "country", message: "Country is required." });
  }

  return errors;
}

export function validateFromDetails(from: FromDetails): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!from) {
    errors.push({ field: "from", message: "Seller details are required." });
    return errors;
  }

  if (!isNonEmptyString(from.businessName)) {
    errors.push({ field: "from.businessName", message: "Business name is required." });
  }

  validateAddress(from.address).forEach(e => errors.push(e));

  if (!isNonEmptyString(from.taxId)) {
    errors.push({ field: "from.taxId", message: "Tax ID is required." });
  }

  if (!from.abnNumber) {
    errors.push({ field: "from.abnNumber", message: "ABN number is required." });
  }

  if (!from.dueDate) {
    errors.push({ field: "from.dueDate", message: "Due date is required." });
  }

  return errors;
}

export function validateCustomer(customer: CustomerInformation): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!customer) {
    errors.push({ field: "customer", message: "Customer information is required." });
    return errors;
  }

  if (!isNonEmptyString(customer.fullName)) {
    errors.push({ field: "customer.fullName", message: "Customer full name is required." });
  }

  if (!isNonEmptyString(customer.email) || !EMAIL_REGEX.test(customer.email)) {
    errors.push({ field: "customer.email", message: "A valid customer email address is required." });
  }

  if (!isNonEmptyString(customer.phone) || !PHONE_REGEX.test(customer.phone)) {
    errors.push({ field: "customer.phone", message: "A valid customer phone number is required." });
  }  

  validateAddress(customer.billingAddress).forEach(e => errors.push(e));
  validateAddress(customer.shippingAddress).forEach(e => errors.push(e));

  return errors;
}

export function validateLineItems(lineItem: LineItem[]): ValidationError[] {
  const errors: ValidationError[] = [];
  if (lineItem.length === 0) {
    errors.push({ field: "lineItems", message: "At least one line item is required." });
    return errors;
  }

  lineItem.forEach((item, index) => {
    const i = `lineItem[${index}]`;
    if (!isNonEmptyString(item.description)) {
      errors.push({ field: `${i}.description`, message: "Item description is required." });
    }
    
    if (item.quantity <= 0) {
      errors.push({ field: `${i}.quantity`, message: "Item quantity must be a positive number." });
    }

    if (item.rate <= 0) {
      errors.push({ field: `${i}.rate`, message: "Item rate (unit price) must be a positive number." });
    }
  });
  
  return errors;
}

export function validateCurrency(currency: string, exchangeRate?: number, baseCurrency?: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!ISO_CURRENCY_REGEX.test(currency)) {
    errors.push({ field: "currency", message: "Currency must be a valid ISO 4217 code." });
  }

  if (baseCurrency !== undefined && baseCurrency !== currency) {
    if (!ISO_CURRENCY_REGEX.test(baseCurrency)) {
      errors.push({ field: "baseCurrency", message: "Base currency must be a valid ISO 4217 code." });
    }

    if (!exchangeRate || exchangeRate < 0) {
      errors.push({
        field: "exchangeRate",
        message: `Exchange rate is required when (${currency}) differs from (${baseCurrency}).`,
      });
    }
  }

  return errors;
}


export function validateTax(tax: TaxDetails): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!tax) {
    errors.push({ field: "tax", message: "Tax details are required." });
    return errors;
  }

  if (!isNonEmptyString(tax.taxId)) {
    errors.push({ field: "tax.taxId", message: "Tax ID is required." });
  }

  if (!isNonEmptyString(tax.countryCode)) {
    errors.push({ field: "tax.countryCode", message: "Country code is required for tax compliance." });
  }

  if (tax.taxPercentage < 0 || tax.taxPercentage > 100)
    errors.push({
      field: "tax.taxPercentage",
      message: "Tax percentage must be a number between 0 and 100.",
    });

  return errors;
}