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
    if (!token) {
        throw new HttpError('Not logged in.', 401);
    }
    
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
  const inv = parsed['Invoice'] || parsed['ubl:Invoice'] || Object.values(parsed)[0] as any;
  
  // Extract due date from invoice XML
  const dueDateStr = getText(inv['cbc:DueDate']);
  let currentStatus = invoice.status;


  //if no due date is found, return the current status without checking for overdu

  // If invoice is not yet paid or deleted, check if it's overdue
  if (currentStatus !== 'Paid' && currentStatus !== 'Deleted' && dueDateStr) {
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    
    // Compare only the date portions (not time) to avoid marking invoices as overdue on the same day
    const Year = new Date().getFullYear();
    const month = new Date().getMonth();
    const day = new Date().getDate();
    const nowDateOnly = new Date(Year, month, day);
    
    if (dueDate < nowDateOnly) {
      currentStatus = 'Overdue';
      // Optionally update the database status
      // await pool.query(`UPDATE invoices SET status = 'Overdue' WHERE invoiceId = $1`, [invoiceId]);
    }
  }

  return currentStatus;
}