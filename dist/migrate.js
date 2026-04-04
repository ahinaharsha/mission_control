"use strict";
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
const datastore_1 = __importDefault(require("./AWS/datastore"));
function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield datastore_1.default.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoiceData JSONB`);
            console.log('Migration successful!');
        }
        catch (e) {
            console.error('Migration failed:', e);
        }
        finally {
            yield datastore_1.default.end();
        }
    });
}
migrate();
