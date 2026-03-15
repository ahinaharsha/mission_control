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
const express_1 = __importStar(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("./swagger.json"));
const process_1 = __importDefault(require("process"));
const auth_1 = require("./AWS/auth/auth");
const class_1 = require("./class");
const generator_1 = require("./invoice-generator/generator");
const retrieveInvoices_1 = require("./invoice-retrieval/retrieveInvoices");
// Set up web app
const app = (0, express_1.default)();
// Middleware
app.use((0, express_1.json)());
app.use(express_1.default.text({ type: ['application/xml', 'text/xml'], limit: '10mb' }));
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
// Swagger docs
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
app.get('/', (req, res) => res.redirect('/docs'));
const PORT = parseInt(process_1.default.env.PORT || '3000');
const HOST = process_1.default.env.IP || '127.0.0.1';
// ===============================================================================
//  ================= Make your routes under this comment guys ===================
// ===============================================================================
app.post('/auth/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.post('/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.post('/auth/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.post("/invoices", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const xml = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        if (!xml || xml === '{}') {
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
            filePath: result.output
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}));
app.get('/invoices', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoices = yield (0, retrieveInvoices_1.retrieveInvoices)(req.user.userId);
        return res.status(200).json(invoices);
    }
    catch (error) {
        if (error instanceof class_1.HttpError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal server error' });
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
