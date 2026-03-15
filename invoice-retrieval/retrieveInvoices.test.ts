import { retrieveInvoices } from '../invoice-retrieval/retrieveInvoices';
import pool from '../AWS/datastore';
import { HttpError } from '../class';

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

  test('valid userId returns invoices', async () => {

    (pool.query as jest.Mock).mockResolvedValue({
      rows: mockDBRows
    });

    const result = await retrieveInvoices(mockUserId);

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT invoiceId, userId, invoiceXML as xml, status FROM invoices WHERE userId = $1',
      [mockUserId]
    );

    expect(result.length).toBe(1);

    expect(result[0].invoiceId).toStrictEqual(expect.any(String));
    expect(result[0].userId).toStrictEqual(expect.any(String));
    expect(result[0].status).toStrictEqual(expect.any(String));
  });

  test('no invoices returns empty array', async () => {

    (pool.query as jest.Mock).mockResolvedValue({
      rows: []
    });

    const result = await retrieveInvoices(mockUserId);

    expect(result).toStrictEqual([]);
  });

  test('database error throws HttpError', async () => {

    (pool.query as jest.Mock).mockRejectedValue(new Error("DB Error"));

    await expect(retrieveInvoices(mockUserId))
      .rejects
      .toBeInstanceOf(HttpError);

  });

});