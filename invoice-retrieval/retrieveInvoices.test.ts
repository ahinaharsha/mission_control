import { retrieveInvoices } from '../invoice-retrieval/retrieveInvoices';
import pool from '../AWS/datastore';

jest.mock('../AWS/datastore', () => ({
  query: jest.fn(),
}));

describe('retrieveInvoices', () => {

  const mockUserId = "user123";

  const mockDBRows = [
    {
      invoiceid: "inv001",
      userid: "user123",
      xml: {
        id: "inv001",
        customer: {
          fullName: "John Doe",
          email: "user@example.com",
          phone: "0400000000",
          billingAddress: {
            street: "123 Street",
            city: "Sydney",
            postcode: "2000",
            country: "Australia"
          },
          shippingAddress: {
            street: "123 Street",
            city: "Sydney",
            postcode: "2000",
            country: "Australia"
          }
        },
        currency: "AUD",
        subtotal: 100,
        taxAmount: 10,
        totalAmount: 110,
        status: "DRAFT"
      },
      status: "DRAFT"
    }
  ];

  it("should retrieve invoices for a user", async () => {

    (pool.query as jest.Mock).mockResolvedValue({
      rows: mockDBRows
    });

    const result = await retrieveInvoices(mockUserId);

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT invoiceId, userId, invoiceXML as xml, status FROM invoices WHERE userId = $1',
      [mockUserId]
    );

    expect(result).toEqual([
      {
        invoiceId: "inv001",
        userId: "user123",
        xml: mockDBRows[0].xml,
        status: "DRAFT"
      }
    ]);
  });

  it("should return empty array if user has no invoices", async () => {

    (pool.query as jest.Mock).mockResolvedValue({
      rows: []
    });

    const result = await retrieveInvoices(mockUserId);

    expect(result).toEqual([]);
  });

  it("should throw error if database fails", async () => {

    (pool.query as jest.Mock).mockRejectedValue(new Error("DB Error"));

    await expect(retrieveInvoices(mockUserId))
      .rejects
      .toThrow("Failed to retrieve invoices");

  });

});