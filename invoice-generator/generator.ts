import { Address, ValidationError, FromDetails, CustomerInformation, TaxDetails, LineItem,InvoiceInput,ValidationResult, generatorResult,invoiceoutput } from "../interface";
import {js2xml,xml2js} from 'xml-js';
import fs from 'fs';
import { validateAddress, validateFromDetails,validateCustomer,validateLineItems,validateCurrency,validateTax } from "../validationEngine/validation";
import { HttpError } from "../class";
import path from 'path';
import { PeppolToolkit } from "@pixeldrive/peppol-toolkit"
import { v4 as uuidv4 } from 'uuid';
import pool from "../AWS/datastore";

// Function to parse the input XML and extract necessary details for invoice generation
export function parseOrderXML(xml: string): InvoiceInput {

  const parsed = xml2js(xml, { compact: true }) as any;
  const order = parsed.Order;

  const buyerParty = order["cac:BuyerCustomerParty"]["cac:Party"];
  const sellerParty = order["cac:SellerSupplierParty"]["cac:Party"];

  const billingAddress = buyerParty["cac:PostalAddress"];

  const orderLine = order["cac:OrderLine"]["cac:LineItem"];

  const invoiceInput: InvoiceInput = {

    customer: {
      id: order["cac:BuyerCustomerParty"]["cbc:CustomerAssignedAccountID"]?._text,

      fullName:
        buyerParty["cac:PartyName"]["cbc:Name"]?._text || "Unknown",

      email:
        buyerParty["cac:Contact"]?.["cbc:ElectronicMail"]?._text || "",

      phone:
        buyerParty["cac:Contact"]?.["cbc:Telephone"]?._text || "",

      billingAddress: {
        street: billingAddress["cbc:StreetName"]?._text,
        city: billingAddress["cbc:CityName"]?._text,
        postcode: billingAddress["cbc:PostalZone"]?._text,
        country: billingAddress["cac:Country"]["cbc:IdentificationCode"]?._text
      },

      shippingAddress: {
        street: billingAddress["cbc:StreetName"]?._text,
        city: billingAddress["cbc:CityName"]?._text,
        postcode: billingAddress["cbc:PostalZone"]?._text,
        country: billingAddress["cac:Country"]["cbc:IdentificationCode"]?._text
      }
    },

    lineItems: [
      {
        description: orderLine["cac:Item"]["cbc:Description"]?._text,

        quantity: Number(orderLine["cbc:Quantity"]?._text),

        rate: Number(orderLine["cac:Price"]["cbc:PriceAmount"]?._text)
      }
    ],

    currency:
      orderLine["cbc:LineExtensionAmount"]?._attributes?.currencyID || "AUD",

    tax: {
      taxId: "GST",
      countryCode: "AU",
      taxPercentage: 10
    },

    from: {
      businessName:
        sellerParty["cac:PartyName"]["cbc:Name"]?._text,

      taxId:
        sellerParty["cac:PartyTaxScheme"]?.["cbc:CompanyID"]?._text || "",

      abnNumber:
        sellerParty["cac:PartyTaxScheme"]?.["cbc:CompanyID"]?._text || "",

      address: {
        street: sellerParty["cac:PostalAddress"]["cbc:StreetName"]?._text,
        city: sellerParty["cac:PostalAddress"]["cbc:CityName"]?._text,
        postcode: sellerParty["cac:PostalAddress"]["cbc:PostalZone"]?._text,
        country:
          sellerParty["cac:PostalAddress"]["cac:Country"]["cbc:IdentificationCode"]?._text
      },

      dueDate: order["cbc:DueDate"]?._text ? new Date(order["cbc:DueDate"]._text) : (order["cac:Delivery"]?.["cbc:StartDate"]?._text ? new Date(order["cac:Delivery"]["cbc:StartDate"]._text) : new Date())
    }
  };

  return invoiceInput;
}

// Function to validate the extracted input data
export function validateInvoiceInput(input: InvoiceInput){
    const customerErrors = validateCustomer(input.customer);

    if (customerErrors.length > 0) {
        throw new HttpError(JSON.stringify(customerErrors),400);
    }
    const fromErrors = validateFromDetails(input.from);

    if (fromErrors.length > 0) {
        throw new HttpError(JSON.stringify(fromErrors),400);
    }

    const lineItemErrors = validateLineItems(input.lineItems);

    if (lineItemErrors.length > 0) {
        throw new HttpError(JSON.stringify(lineItemErrors   ),400);
    }

    const currencyErrors = validateCurrency(input.currency);

    if (currencyErrors.length > 0) {
        throw new HttpError(JSON.stringify(currencyErrors),400);
    }
    
    const taxErrors = validateTax(input.tax);
    if (taxErrors.length > 0) {
        throw new HttpError(JSON.stringify(taxErrors),400);
    }
} 
    

// Function to generate the invoice XML using the PeppolToolkit
export function create_invoice(input: InvoiceInput): string {

  const toolkit = new PeppolToolkit();

  const subtotal = input.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  const taxAmount = subtotal * (input.tax.taxPercentage / 100);

  const total = subtotal + taxAmount;

  const invoiceData = {
    ID: `INV-${Date.now()}`,

    issueDate: new Date().toISOString().split("T")[0],

    dueDate: input.from.dueDate?.toISOString().split("T")[0],

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

  return toolkit.invoiceToPeppolUBL(invoiceData as any);
}

// Main function to handle the entire invoice generation process
export async function generateInvoice(xml: string, token: string|undefined): Promise<generatorResult> {
    if (!token) {
      throw new HttpError('Not logged in.', 401);
    }

    if (!xml || xml.trim() === '' || xml === '{}' || !xml.trim().startsWith('<')) {
      throw new HttpError('Invalid XML format.', 400);
    }

    let input: InvoiceInput;
    try {
      input = parseOrderXML(xml);
    } catch (e: any) {
      throw new HttpError('Invalid XML format.', 400);
    }

    validateInvoiceInput(input); 

    const invoiceXML:string = create_invoice(input);
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceId = uuidv4();
    const userResult = await pool.query(
      `SELECT userId FROM users WHERE token = $1`,
      [token]
    );

    if (userResult.rows.length === 0) {
      throw new HttpError('Invalid or expired token.', 401);
    }

    const userId = userResult.rows[0].userid;
    console.log("User ID from token:", userId);
    const result = await pool.query(   `INSERT INTO invoices (invoiceId, userId, invoiceXML, invoiceData, status)   VALUES ($1, $2, $3, $4, $5)   RETURNING *`,  
       [invoiceId, userId, invoiceXML, JSON.stringify(input), 'Generated'] );
 

    
    

    return {
        output:invoiceXML ,
        message: "Invoice generated successfully.",
        code: 200,
        invoiceId: invoiceId
    };
}



