import { Address, ValidationError, FromDetails, CustomerInformation } from "../interface";
import { isNonEmptyString } from "../src/helpers/validationHelpers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;

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