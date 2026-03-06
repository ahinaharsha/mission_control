export interface Address {
  street: string;
  city: string;
  postcode: string;
  country: string;
}

export interface FromDetails {
  businessName: string;
  address: Address;
  taxId: string;
  abnNumber: string | number;
}

export interface CustomerInformation {
  fullName: string;
  email: string;
  phone: string;
  billingAddress: Address;
  shippingAddress: Address;
}

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
}

export interface TaxDetails {
  taxId: string;
  countryCode: string;
  taxPercentage: number;
}
export interface InvoiceInput {
  customer: CustomerInformation;
  lineItems: LineItem[];
  currency: string;
  exchangeRate?: number;
  baseCurrency?: string;
  tax: TaxDetails;
  from: FromDetails;
}
export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
}

export type InvoiceStatus =
  | "Generated"
  | "InProgress"
  | "Sent"
  | "Paid"
  | "Overdue"
  | "Deleted";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}