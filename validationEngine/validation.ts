import { Address, ValidationError, FromDetails } from "../interface";
import { isNonEmptyString } from "../src/helpers/validationHelpers";


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