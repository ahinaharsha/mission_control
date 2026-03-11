import {describe, expect, test} from '@jest/globals';
import { create_invoice, generateInvoice } from "./generator";
import { InvoiceInput } from '../interface';
import fs from 'fs';




describe("Invoice Generator", () => {
  test("should generate an invoice XML", () => {
    const content = fs.readFileSync("./invoice.xml", "utf-8");
    const result = generateInvoice(content);
    expect(result.code).toBe(200);
    expect(result.message).toBe("Invoice generated successfully.");
    expect(result.input).toBeDefined();
  });

  test("should generate valid XML", () => {

    const input = {

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

    const xml = create_invoice(input);

    expect(xml).toContain("<ID>");
    expect(xml).toContain("John Doe");
    expect(xml).toContain("Product A");


  });

});