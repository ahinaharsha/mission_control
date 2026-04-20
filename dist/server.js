"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importStar(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yaml_1 = __importDefault(require("yaml"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
const auth_1 = require("./AWS/auth/auth");
const class_1 = require("./class");
const generator_1 = require("./invoice-generator/generator");
const retrieveInvoices_1 = require("./invoice-retrieval/retrieveInvoices");
const generateInvoicePDF_1 = require("./invoice-generator/generateInvoicePDF");
const invoiceDeletion_1 = require("./invoice-deletion/invoiceDeletion");
const TrackStatus_1 = require("./invoice-generator/TrackStatus");
const updateInvoice_1 = require("./invoice-update/updateInvoice");
const chat_1 = require("./AI-Implementation/chat");
const AIinvoicegeneration_1 = require("./AI-Implementation/AIinvoicegeneration");
const updateTier_1 = require("./AI-Implementation/updateTier");
// Set up web app
const app = (0, express_1.default)();
exports.app = app;
// Middleware
app.use((0, express_1.json)());
app.use(express_1.default.text({ type: ['application/xml', 'text/xml'], limit: '10mb' }));
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
// Swagger docs
const file = fs_1.default.readFileSync(path_1.default.join(process_1.default.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req, res) => res.redirect('/docs'));
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(yaml_1.default.parse(file)));
const PORT = parseInt(process_1.default.env.PORT || '3000');
const HOST = process_1.default.env.IP || '127.0.0.1';
// ===============================================================================
//  ================= Make your routes under this comment guys ===================
// ===============================================================================
app.post('/v1/auth/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, auth_1.authRegister)(req.body.email, req.body.password);
        res.status(201).json({ message: 'User registered successfully.' });
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            res.status(e.statusCode).json({ error: e.message });
        }
        else {
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}));
// POST /auth/login
app.post('/v1/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, auth_1.authLogin)(req.body.email, req.body.password);
        res.status(200).json(result);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            res.status(e.statusCode).json({ error: e.message });
        }
        else {
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}));
// POST /auth/logout
app.post('/v1/auth/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, auth_1.authLogout)(req.header('token'));
        res.status(200).json({ message: 'Logged out successfully.' });
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            res.status(e.statusCode).json({ error: e.message });
        }
        else {
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}));
// POST/invoices
app.post('/v1/invoices', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield (0, generator_1.generateInvoice)(xml, req.header('token'));
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
    }
    catch (error) {
        if (error instanceof class_1.HttpError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error(error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}));
app.get('/v1/invoices/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const invoiceId = req.params.id;
        const invoice = yield (0, retrieveInvoices_1.retrieveInvoices)(invoiceId, token);
        return res.status(200).json(invoice);
    }
    catch (error) {
        if (error instanceof class_1.HttpError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.put('/v1/invoices/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const invoiceId = req.params.id;
        const result = yield (0, updateInvoice_1.updateInvoice)(invoiceId, token, req.body);
        res.status(200).json(result);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        return res.status(500).json({ error: 'Internal server error.' });
    }
}));
app.delete('/v1/invoices/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const invoiceId = req.params.id;
        const result = yield (0, invoiceDeletion_1.deleteInvoice)(invoiceId, token);
        res.status(200).json(result);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        return res.status(500).json({ error: 'Internal server error.' });
    }
}));
app.get('/v1/invoices/:id/pdf', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const invoiceId = req.params.id;
        const pdfBuffer = yield (0, generateInvoicePDF_1.getInvoicePDF)(invoiceId, token);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
        res.status(200).send(pdfBuffer);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        return res.status(500).json({ error: 'Internal server error.' });
    }
}));
//getting invoice status
app.get('/v1/invoices/:id/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const invoiceId = req.params.id;
        const status = yield (0, TrackStatus_1.getStatus)(invoiceId, token);
        return res.status(200).json({ status });
    }
    catch (error) {
        if (error instanceof class_1.HttpError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
//adding invoice status update route.
app.put('/v1/invoices/:id/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const invoiceId = req.params.id;
        const { status: newStatus } = req.body;
        // this doesnt work
        yield (0, TrackStatus_1.updateStatus)(invoiceId, newStatus, token);
        return res.status(200).json({ message: 'Status updated successfully.' });
    }
    catch (error) {
        if (error instanceof class_1.HttpError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/v1/ai/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }
        const result = yield (0, chat_1.chat)(token, message);
        return res.status(200).json(result);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        console.error(e);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}));
app.post('/v1/ai/invoices', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'Invoice description is required.' });
        }
        const result = yield (0, AIinvoicegeneration_1.generateInvoiceFromAI)(token, description);
        return res.status(201).json(result);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        console.error(e);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}));
app.post('/v1/ai/invoices/autofill', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'Invoice description is required.' });
        }
        const result = yield (0, AIinvoicegeneration_1.generateInvoicePrefill)(token, description);
        return res.status(200).json(result);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        console.error(e);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}));
app.delete('/v1/ai/chat/history', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const result = yield (0, chat_1.clearChatHistory)(token);
        return res.status(200).json(result);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        return res.status(500).json({ error: 'Internal server error.' });
    }
}));
app.put('/v1/users/tier', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('token');
        const { tier } = req.body;
        if (!tier) {
            return res.status(400).json({ error: 'Tier is required.' });
        }
        const result = yield (0, updateTier_1.updateTier)(token, tier);
        return res.status(200).json(result);
    }
    catch (e) {
        if (e instanceof class_1.HttpError) {
            return res.status(e.statusCode).json({ error: e.message });
        }
        console.error(e);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}));
// Start server
const server = app.listen(PORT, HOST, () => {
    console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});
// For coverage, handle Ctrl+C gracefully
process_1.default.on('SIGINT', () => {
    server.close(() => {
        console.log('Shutting down server gracefully.');
        process_1.default.exit();
    });
});
exports.default = app;
