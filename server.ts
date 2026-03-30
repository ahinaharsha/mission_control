import express, { json, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import sui from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { authRegister, authLogin, authLogout, authenticate } from './AWS/auth/auth';
import jwt from 'jsonwebtoken';
import { HttpError } from './class';
import pool from './AWS/datastore';
import { generateInvoice } from './invoice-generator/generator';
import { retrieveInvoices } from './invoice-retrieval/retrieveInvoices';
import { getInvoicePDF } from './invoice-generator/generateInvoicePDF';
import { deleteInvoice } from './invoice-deletion/invoiceDeletion';
import { getStatus } from './invoice-generator/TrackStatus';
import { updateInvoice } from './invoice-update/updateInvoice';

// Set up web app
const app = express();

// Middleware
app.use(json());
app.use(express.text({ type: ['application/xml', 'text/xml'], limit: '10mb' }));
app.use(cors());
app.use(morgan('dev'));

// Swagger docs
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file)));

const PORT: number = parseInt(process.env.PORT || '3000');
const HOST: string = process.env.IP || '127.0.0.1';

// ===============================================================================
//  ================= Make your routes under this comment guys ===================
// ===============================================================================

app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    await authRegister(req.body.email, req.body.password);
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.statusCode).json({ error: e.message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

// POST /auth/login
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const result = await authLogin(req.body.email, req.body.password);
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.statusCode).json({ error: e.message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

// POST /auth/logout
app.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    await authLogout(req.header('token'));
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.statusCode).json({ error: e.message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

// POST/invoices
app.post("/invoices", async (req: Request, res: Response) => {
  try {
    const xml = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    if (!xml || xml.trim() === '' || xml === '{}' || !xml.trim().startsWith('<')) {
      return res.status(400).json({ error: "Invalid XML format." });
    } 

    if (!xml || xml.trim() === '' || xml === '{}') {
      return res.status(400).json({
        error: "Missing XML order document"
      });
    }

    const result = await generateInvoice(xml, req.header('token'));

    if (result.code !== 200) {
      return res.status(result.code).json({
        error: result.message
      });
    }

    return res.status(201).json({
      message: result.message,
      invoiceId: result.invoiceId,
      filePath: result.output
    });

  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

app.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const token = req.header('token');
    authenticate(token);
    const invoiceId = req.params.id as string;
    const invoice = await retrieveInvoices(invoiceId);
    return res.status(200).json(invoice);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const token = req.header('token');
    const invoiceId = req.params.id as string;
    const result = await updateInvoice(invoiceId, token, req.body);
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof HttpError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.delete('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const token = req.header('token');
    const invoiceId = req.params.id as string;
    const result = await deleteInvoice(invoiceId, token);
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof HttpError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/invoices/:id/pdf', async (req: Request, res: Response) => {
  try {
    const token = req.header('token');
    const invoiceId = req.params.id as string;
    const pdfBuffer = await getInvoicePDF(invoiceId, token);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (e) {
    if (e instanceof HttpError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//getting invoice status
app.get('/invoices/:id/status', async (req: Request, res: Response) => {
  try {
    const token = req.header('token');
    const invoiceId = req.params.id as string;
    const status = await getStatus(invoiceId, token);
    return res.status(200).json({ status });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

//adding invoice status update route.
app.put('/invoices/:id/status', async (req: Request, res: Response) => {
  try {
    const token = req.header('token');
    const invoiceId = req.params.id as string;
    const { status: newStatus } = req.body;
    
    await updateStatus(invoiceId, newStatus, token);
    
    return res.status(200).json({ message: 'Status updated successfully.' });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
    
});


// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});

export { app };
export default app;