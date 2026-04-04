import pool from '../AWS/datastore';
import { invoiceoutput } from '../interface';
import { HttpError } from '../class';
import { authenticate } from '../AWS/auth/auth';
import jwt from 'jsonwebtoken';

export async function retrieveInvoices(invoiceId: string, token: string | undefined): Promise<invoiceoutput> {
  authenticate(token);

  const decoded = jwt.decode(token as string) as { userId: string };
  const userId = decoded.userId;

  const result = await pool.query(
    'SELECT invoiceId, userId, invoiceXML as xml, status FROM invoices WHERE invoiceId = $1',
    [invoiceId]
  );

  if (result.rows.length === 0) {
    throw new HttpError('Invoice not found.', 404);
  }

  const invoice = result.rows[0];

  if (invoice.userid !== userId) {
    throw new HttpError('Forbidden.', 403);
  }

  return {
    invoiceId: invoice.invoiceid,
    userId: invoice.userid,
    xml: invoice.xml,
    status: invoice.status
  };
}