import express, { json, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { authRegister, authLogin, authLogout, authenticate } from './AWS/auth/auth';
import { HttpError } from './class';

// Set up web app
const app = express();

// Middleware
app.use(json());
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
