import pool from '../AWS/datastore';
import { invoiceoutput } from '../interface';

export async function retrieveInvoices(userId: string): Promise<invoiceoutput[]> {
  try {
    const result = await pool.query(
      'SELECT invoiceId, userId, invoiceXML as xml, status FROM invoices WHERE userId = $1',
      [userId]
    );

    return result.rows.map(row => ({
      invoiceId: row.invoiceid,
      userId: row.userid,
      xml: row.xml,
      status: row.status
    }));
  } catch (error) {
    throw new Error('Failed to retrieve invoices');
  }
}