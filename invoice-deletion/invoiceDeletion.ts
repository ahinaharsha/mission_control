import pool from '../AWS/datastore';
import { HttpError } from '../class';
import { InvoiceStatus } from '../interface';

const ALLOWED_STATUSES: InvoiceStatus[] = ['Generated', 'InProgress'];

export async function deleteInvoice(invoiceId: string, token: string | undefined): Promise<{ message: string }> {
  if (!token) {
    throw new HttpError('Not logged in.', 401);
  }

  const userResult = await pool.query(
    `SELECT userId FROM users WHERE token = $1`,
    [token]
  );

  if (userResult.rows.length === 0) {
    throw new HttpError('Invalid or expired token.', 401);
  }

  const userId = userResult.rows[0].userid;
  const invoiceResult = await pool.query(
    `SELECT * FROM invoices WHERE invoiceId = $1`,
    [invoiceId]
  );

  if (invoiceResult.rows.length === 0) {
    throw new HttpError('Invoice not found.', 404);
  }

  const invoice = invoiceResult.rows[0];

  if (invoice.userid !== userId) {
    throw new HttpError('Forbidden.', 403);
  }

  if (!ALLOWED_STATUSES.includes(invoice.status)) {
    throw new HttpError('Invoice already finalised, sent, or paid.', 409);
  }

  await pool.query(
    `DELETE FROM invoices WHERE invoiceId = $1`,
    [invoiceId]
  );
  return { message: 'Invoice deleted successfully.' };
}