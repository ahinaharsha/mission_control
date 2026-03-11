import {describe, expect, test} from '@jest/globals';
import { generateInvoice } from "../invoicegenerator/generator";
import { InvoiceInput } from '../interface';

describe("Invoice Generator", () => {

  test("should generate valid XML", () => {

    const input:InvoiceInput = {

      customer: {
        id: "CUST-1",
        fullName: "John Doe",
        email: "john@test.com",
        phone: "12345678",
        billingAddress: {
            street: "456 Road",
            city: "Sydney",
            postcode: "2001",
            country: "AU"
            },

        shippingAddress: {
            street: "456 Road",
            city: "Sydney",
            postcode: "2001",
            country: "AU"
        }
      },
      lineItems: [
      {
        description: "Product A",
        quantity: 2,
        rate: 50
      }],
      currency: "AUD",
      tax: {
        taxId: "GST",
        countryCode: "AU",
        taxPercentage: 10
      },

      from: {

        businessName: "Test Business",
        address: {
          street: "123 Street",
          city: "Sydney",
          postcode: "2000",
          country: "AU"
        },
        taxId: "gst-123",
        abnNumber: "456",
        dueDate: new Date("2026-07-01")
      }     
  };

    const xml = generateInvoice(input);

    expect(xml).toContain("<Invoice");
    expect(xml).toContain("John Doe");
    expect(xml).toContain("Product A");

  });

});