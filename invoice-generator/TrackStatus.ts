import PDFDocument from 'pdfkit';
import { xml2js } from 'xml-js';
import pool from '../AWS/datastore';
import { HttpError } from '../class';
import { authenticate } from '../AWS/auth/auth';
import jwt from 'jsonwebtoken';

function getText(node: any): string {
  if (!node) {
    return '';
  }

  if (node._text) {
    return String(node._text);
  }

  return '';
}


export async function getStatus(invoiceId: string, token: string | undefined){
    //Returns the status of the invoice with the given ID. Possible statuses: "Generated", "InProgress", "Sent", "Paid", "Overdue", "Deleted"
    authenticate(token);
    
    const decoded = jwt.decode(token as string) as { userId: string };
    const userId = decoded.userId;
    const invoiceResult = await pool.query(
        `SELECT userid,invoiceXML,status FROM invoices WHERE invoiceId = $1`,
        [invoiceId]
    );
    //get the status from the database and return it. If the invoice is not found, return 404. If the invoice belongs to another user, return 403.

    if (invoiceResult.rows.length === 0) {
    throw new HttpError('Invoice not found.', 404);
  }

  const invoice = invoiceResult.rows[0];

  if (invoice.userid !== userId) {
    throw new HttpError('Forbidden.', 403);
  }

  const parsed = xml2js(invoice.invoicexml, { compact: true }) as any;
  const inv = parsed.Invoice;
  
  // Extract due date from invoice XML
  const dueDateStr = getText(inv['cbc:DueDate']);
  let currentStatus = invoice.status;

  if (currentStatus === 'Overdue') {
    return currentStatus;
  }
  // If invoice is not yet paid or deleted, check if it's overdue
  if (currentStatus !== 'Paid'  && dueDateStr) {
    const dueDateObj = new Date(dueDateStr);
    
    const dueDate = new Date(
    dueDateObj.getFullYear(),
    dueDateObj.getMonth(),
    dueDateObj.getDate()
  );
    const Year = new Date().getFullYear();
    const month = new Date().getMonth();
    const day = new Date().getDate();
    const nowDateOnly = new Date(Year, month, day);
    
    if (dueDate < nowDateOnly) {
      currentStatus = 'Overdue';
      await pool.query(
        `UPDATE invoices SET status = $1 WHERE invoiceId = $2`,
        [currentStatus, invoiceId]
      );
    }
  }

  return  currentStatus;
}

export async function updateStatus(invoiceId: string, status: string, token: string | undefined)
 {
    authenticate(token);
    
    const decoded = jwt.decode(token as string) as { userId: string };

    // Verify status is valid
    const validStatuses = ['Generated', 'InProgress', 'Sent', 'Paid', 'Overdue', 'Deleted'];
    if (!validStatuses.includes(status)) {
      throw new HttpError('Invalid status value.', 400);
    }
    const userId = decoded.userId;

    
    // Verify invoice exists and belongs to user
    const invoiceResult = await pool.query(
      `SELECT userid FROM invoices WHERE invoiceId = $1`,
      [invoiceId]
    );
    
    if (invoiceResult.rows.length === 0) {
      throw new HttpError('Invoice not found.', 404);
    }
    
    if (invoiceResult.rows[0].userid !== userId) {
      throw new HttpError('Forbidden.', 403);
    }
    
    // Update status
    await pool.query(
      `UPDATE invoices SET status = $1 WHERE invoiceId = $2`,
      [status, invoiceId]
    );
}