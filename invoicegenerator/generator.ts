import { Address, ValidationError, FromDetails, CustomerInformation, TaxDetails, LineItem,InvoiceInput,ValidationResult } from "../interface";
import {js2xml,xml2js} from 'xml-js';
import fs from 'fs';
import { validateAddress, validateFromDetails,validateCustomer,validateLineItems,validateCurrency,validateTax } from "../validationEngine/validation";


export function parseOrderXML(xml: string): InvoiceInput {

  const parsed = xml2js(xml, { compact: true }) as any;

  const order = parsed.Order;

  const invoiceInput: InvoiceInput = {
    customer: {
      id: order.Customer.ID._text,
      fullName: order.Customer.Name._text,
      email: order.Customer.Email._text,
      phone: order.Customer.Phone._text,
      billingAddress: {
        street: order.Customer.Address.Street._text,
        city: order.Customer.Address.City._text,
        postcode: order.Customer.Address.Postcode._text,
        country: order.Customer.Address.Country._text
      },
      shippingAddress: {
        street: order.Customer.Address.Street._text,
        city: order.Customer.Address.City._text,
        postcode: order.Customer.Address.Postcode._text,
        country: order.Customer.Address.Country._text
      }
    },
    lineItems: order.LineItems.LineItem.map((item: any) => ({
      description: item.Description._text,
      quantity: Number(item.Quantity._text),
      rate: Number(item.Rate._text)
    })),
     currency: order.Currency._text,
    tax: {
        taxId: order.Tax.TaxId._text,
        countryCode: order.Tax.CountryCode._text,   
        taxPercentage: Number(order.Tax.Percentage._text)
    },
    from: {
      businessName: order.Seller.BusinessName._text,
      taxId: order.Seller.TaxId._text,
      abnNumber: order.Seller.ABN._text,
      address: {
        street: order.Seller.Address.Street._text,
        city: order.Seller.Address.City._text,
        postcode: order.Seller.Address.Postcode._text,
        country: order.Seller.Address.Country._text
      },
      dueDate: new Date(order.DueDate._text)
    }
    
  };

  return invoiceInput;
}
export function validateInvoiceInput(input: InvoiceInput){
    const customerErrors = validateCustomer(input.customer);

    if (customerErrors.length > 0) {
        throw new Error(JSON.stringify(customerErrors));
    }
    const fromErrors = validateFromDetails(input.from);

    if (fromErrors.length > 0) {
        throw new Error(JSON.stringify(fromErrors));
    }

    const lineItemErrors = validateLineItems(input.lineItems);

    if (lineItemErrors.length > 0) {
        throw new Error(JSON.stringify(lineItemErrors));
    }

    const currencyErrors = validateCurrency(input.currency);

    if (currencyErrors.length > 0) {
        throw new Error(JSON.stringify(currencyErrors));
    }
    
    const taxErrors = validateTax(input.tax);
    if (taxErrors.length > 0) {
        throw new Error(JSON.stringify(taxErrors));
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
    const result = convert.jstoxml(invoiceData,options);
    
    return result;
    
}


export function generateInvoice(input: InvoiceInput): string{
    const invoiceXML:string = create_invoice(input);
    const invoiceNumber = `INV-${Date.now()}`;
    const filePath = `./invoices/${invoiceNumber}.xml`;
    fs.writeFileSync(filePath, invoiceXML);
    return filePath;
}



