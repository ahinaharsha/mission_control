import { retrieveInvoices } from '../invoice-retrieval/retrieveInvoices';
import pool from '../AWS/datastore';
import { HttpError } from '../class';

jest.mock('../AWS/datastore', () => ({
  query: jest.fn(),
}));

describe('retrieveInvoices', () => {

  const mockInvoiceId = "inv001";

  const mockDBRow = {
    invoiceid: "inv001",
    userid: "user123",
    xml: "<Invoice>...</Invoice>",
    status: "Generated"
  };

  test('valid invoiceId returns invoice', async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [mockDBRow]
    });

    const result = await retrieveInvoices(mockInvoiceId);

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT invoiceId, userId, invoiceXML as xml, status FROM invoices WHERE invoiceId = $1',
      [mockInvoiceId]
    );

    expect(result.invoiceId).toStrictEqual(expect.any(String));
    expect(result.userId).toStrictEqual(expect.any(String));
    expect(result.status).toStrictEqual(expect.any(String));
  });

  test('invoice not found throws HttpError 404', async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: []
    });

    try {
      await retrieveInvoices(mockInvoiceId);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).statusCode).toStrictEqual(404);
    }
  });

  test('database error throws HttpError', async () => {
    (pool.query as jest.Mock).mockRejectedValue(new Error("DB Error"));

    try {
      await retrieveInvoices(mockInvoiceId);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).statusCode).toStrictEqual(500);
    }
  });
});