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
function migrateAI() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield datastore_1.default.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(10) DEFAULT 'standard'`);
            yield datastore_1.default.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0`);
            yield datastore_1.default.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE`);
            yield datastore_1.default.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id UUID PRIMARY KEY,
        userId UUID REFERENCES users(userId),
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
            console.log('AI migration successful!');
        }
        catch (e) {
            console.error('Migration failed:', e);
        }
        finally {
            yield datastore_1.default.end();
        }
    });
}
migrateAI();
