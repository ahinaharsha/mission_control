import pool from '../AWS/datastore';
import { HttpError } from '../class';
import { InvoiceInput, InvoiceStatus } from '../interface';
import { authenticate } from '../AWS/auth/auth';
import { create_invoice, validateInvoiceInput } from '../invoice-generator/generator';
import jwt from 'jsonwebtoken';

const ALLOWED_STATUSES: InvoiceStatus[] = ['Generated', 'InProgress'];

export async function updateInvoice(invoiceId: string, token: string | undefined, updates: Partial<InvoiceInput>): Promise<{ message: string }> {
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

  if (!invoice.invoicedata) {
    throw new HttpError('Invoice data not found.', 404);
  }   

  if (invoice.userid !== userId) {
    throw new HttpError('Forbidden.', 403);
  }

  if (!ALLOWED_STATUSES.includes(invoice.status)) {
    throw new HttpError('Invoice already finalised.', 409);
  }

  const existing: InvoiceInput = invoice.invoicedata;

  if (updates.customer) {
    existing.customer = updates.customer;
  }

  if (updates.lineItems) {
    existing.lineItems = updates.lineItems;
  }

  if (updates.currency) {
    existing.currency = updates.currency;
  }

  if (updates.tax) {
    existing.tax = updates.tax;
  }
  
  if (updates.from) {
    existing.from = updates.from;
  }

  validateInvoiceInput(existing);

  if (existing.from.dueDate) {
    existing.from.dueDate = new Date(existing.from.dueDate);
	}

  const updatedXML = create_invoice(existing);

  await pool.query(
    `UPDATE invoices SET invoiceXML = $1, invoiceData = $2 WHERE invoiceId = $3`,
    [updatedXML, JSON.stringify(existing), invoiceId]
  );

  return { message: 'Invoice updated successfully.' };
}