import express, { json, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';

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
