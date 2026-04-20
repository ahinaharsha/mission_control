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
exports.updateTier = updateTier;
const datastore_1 = __importDefault(require("../AWS/datastore"));
const class_1 = require("../class");
const auth_1 = require("../AWS/auth/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const VALID_TIERS = ['standard', 'pro'];
function updateTier(token, tier) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, auth_1.authenticate)(token);
        if (!VALID_TIERS.includes(tier)) {
            throw new class_1.HttpError('Invalid tier. Must be standard or pro.', 400);
        }
        const decoded = jsonwebtoken_1.default.decode(token);
        const userId = decoded.userId;
        const result = yield datastore_1.default.query(`UPDATE users SET tier = $1 WHERE userId = $2 RETURNING tier`, [tier, userId]);
        if (result.rows.length === 0) {
            throw new class_1.HttpError('User not found.', 404);
        }
        return { message: `Tier updated to ${tier} successfully.`, tier };
    });
}
