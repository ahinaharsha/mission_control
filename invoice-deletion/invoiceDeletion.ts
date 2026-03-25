import pool from '../AWS/datastore';
import { HttpError } from '../class';
import { InvoiceStatus } from '../interface';
import { authenticate } from '../AWS/auth/auth';
import jwt from 'jsonwebtoken';

const ALLOWED_STATUSES: InvoiceStatus[] = ['Generated', 'InProgress'];

export async function deleteInvoice(invoiceId: string, token: string | undefined): Promise<{ message: string }> {
  authenticate(token);

  const decoded = jwt.decode(token as string) as { userId: string };
  const userId = decoded.userId;

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