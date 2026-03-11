import { Address, ValidationError, FromDetails, CustomerInformation, TaxDetails, LineItem,InvoiceInput,ValidationResult, generatorResult } from "../interface";
import {js2xml,xml2js} from 'xml-js';
import fs from 'fs';
import { validateAddress, validateFromDetails,validateCustomer,validateLineItems,validateCurrency,validateTax } from "../validationEngine/validation";
import { HttpError } from "../class";
import path from 'path';


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

      dueDate: new Date()
    }
  };

  return invoiceInput;
}
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
    


export function create_invoice(input: InvoiceInput): string {

    let amount:number = 0;
    for (let i: number = 0; i < input.lineItems.length; i++) {
        amount += input.lineItems[i].quantity * input.lineItems[i].rate;
    }

    let Tax:number = input.tax.taxPercentage/100 * amount;
    var convert = require('xml-js');

    const Totalamount:number = amount + Tax;
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceData = {

        ID: invoiceNumber,
        issueDate: Date.now(),
        DueDate: input.from.dueDate,
        invoiceTypeCode: 380,

        Currency: input.currency,
        paymentTermsNote:input.paymentTermsNote,
        exchangeRate: input.exchangeRate,

        seller : {
            name: input.from.businessName,
            taxId: input.from.taxId,
            abn: input.from.abnNumber,

            address: {
            street: input.from.address.street,
            city: input.from.address.city,
            postcode: input.from.address.postcode,
            country: input.from.address.country
            }

        },

        buyer:{
            name: input.customer.fullName,
            email: input.customer.email,
            phone: input.customer.phone,

            billing_address: {
            street: input.customer.billingAddress?.street,
            city: input.customer.billingAddress?.city,
            postcode: input.customer.billingAddress?.postcode,
            country: input.customer.billingAddress?.country
            },
            shipping_address: {
                street: input.customer.shippingAddress.street,
                city: input.customer.shippingAddress.city,
                postcode: input.customer.shippingAddress.postcode,
                country: input.customer.shippingAddress.country
            }
        },

        tax:[{
            taxAmount: Tax,
            countryCode: input.tax.countryCode,
            taxPercentage: input.tax.taxPercentage
        }],

        legalMonetaryTotal : {
            lineExtensionAmount: amount,
            taxExclusiveAmount: amount,
            taxInclusiveAmount: Totalamount,
            payableAmount: Totalamount 
        },

        invoiceLine: input.lineItems.map((item, index) => ({
            ID: index + 1,
            description: item.description,          
            quantity: item.quantity,
            unitPrice: item.rate,
            lineExtensionAmount: item.quantity * item.rate
        }))

    };
    var options = {compact: true, ignoreComment: true, spaces: 4};

    const result = convert.json2xml(invoiceData,options);
    return result;
    
}


export function generateInvoice(xml: string): generatorResult{
    const input = parseOrderXML(xml);
    try{
        validateInvoiceInput(input);
    }
    catch(error:any){
        return {
            message: error.message,
            code: error.statusCode || 500
        };
    }


    const invoiceXML:string = create_invoice(input);
    const invoiceNumber = `INV-${Date.now()}`;
    const dirPath = './invoices';
    const filePath = path.join(dirPath, `${invoiceNumber}.xml`);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); 
    }
    fs.writeFileSync(filePath, invoiceXML);
    return {
        input: filePath,
        message: "Invoice generated successfully.",
        code: 200
    };
}



