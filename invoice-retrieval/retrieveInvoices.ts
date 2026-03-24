import pool from '../AWS/datastore';
import { invoiceoutput } from '../interface';
import { HttpError } from '../class';

export async function retrieveInvoices(invoiceId: string): Promise<invoiceoutput> {
  try {
    const result = await pool.query(
      'SELECT invoiceId, userId, invoiceXML as xml, status FROM invoices WHERE invoiceId = $1',
      [invoiceId]
    );

    if (result.rows.length === 0) {
      throw new HttpError('Invoice not found.', 404);
    }

    const row = result.rows[0];
    return {
      invoiceId: row.invoiceid,
      userId: row.userid,
      xml: row.xml,
      status: row.status
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('Error retrieving invoices:', error);
    throw new HttpError('Failed to retrieve invoices', 500);
  }
}