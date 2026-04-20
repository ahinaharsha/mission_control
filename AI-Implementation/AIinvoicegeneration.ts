import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';
import pool from '../AWS/datastore';
import { HttpError } from '../class';
import { authenticate } from '../AWS/auth/auth';
import { InvoiceInput } from '../interface';
import { generateInvoiceFromInput } from '../invoice-generator/generator';
import { validateInvoiceInput } from '../invoice-generator/generator';
import {getUserFromToken,resetMessageCountIfNeeded,getChatHistory} from "./chat";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const STANDARD_MESSAGE_LIMIT = 25;

const STANDARD_SYSTEM_PROMPT = `You are an expert invoicing assistant for MC Invoicing.
Convert the user's request into valid JSON that matches the InvoiceInput TypeScript shape.

REQUIRED FIELDS (must be provided or inferred):
- customer: fullName, email, phone, billingAddress (street, city, postcode, country), shippingAddress
- from: businessName, address (street, city, postcode, country), taxId, abnNumber, dueDate (YYYY-MM-DD)
- lineItems: array with at least one item containing description, quantity (number), rate (number)
- currency: 3-letter ISO code (e.g., "AUD")
- tax: taxId, countryCode, taxPercentage (number)

If the user doesn't provide enough information to fill all required fields, return a JSON with an "error" field explaining what's missing instead of incomplete invoice data.

Return only the JSON object and do not include any additional explanation.`;

const PRO_SYSTEM_PROMPT = `You are an expert invoicing assistant for MC Invoicing.
Convert the user's request into valid JSON that matches the InvoiceInput TypeScript shape for frontend prefill.

REQUIRED FIELDS (must be provided or inferred):
- customer: fullName, email, phone, billingAddress (street, city, postcode, country), shippingAddress
- from: businessName, address (street, city, postcode, country), taxId, abnNumber, dueDate (YYYY-MM-DD)
- lineItems: array with at least one item containing description, quantity (number), rate (number)
- currency: 3-letter ISO code (e.g., "AUD")
- tax: taxId, countryCode, taxPercentage (number)

If insufficient information is provided, return a JSON with an "error" field listing missing requirements rather than incomplete data.

Return only the JSON object and do not include any additional explanation.`;



async function incrementMessageCount(userId: string) {
  await pool.query(
    `UPDATE users SET message_count = message_count + 1 WHERE userId = $1`,
    [userId]
  );
}


function extractJsonText(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new HttpError('AI returned invalid JSON.', 500);
  }
  return text.slice(start, end + 1);
}

export function normalizeInvoiceInput(raw: any): InvoiceInput {
  if (!raw || typeof raw !== 'object') {
    throw new HttpError('AI returned an invalid invoice payload.', 500);
  }

  // Check if AI returned an error instead of invoice data
  if (raw.error) {
    throw new HttpError(`Insufficient information provided: ${raw.error}`, 400);
  }

  const invoice = { ...raw } as any;

  if (invoice.from?.dueDate) {
    invoice.from.dueDate = new Date(invoice.from.dueDate);
  }

  if (Array.isArray(invoice.lineItems)) {
    invoice.lineItems = invoice.lineItems.map((item: any) => ({
      description: item.description || '',
      quantity: Number(item.quantity || 0),
      rate: Number(item.rate || 0),
    }));
  }

  return invoice as InvoiceInput;
}

async function requestInvoiceInputFromAI(token: string, description: string, systemPrompt: string, includeHistory = false) {
  authenticate(token);

  const user = await getUserFromToken(token);
  const messages = includeHistory ? await getChatHistory(user.userid) : [];

  messages.push({ role: 'user' as const, content: description });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  const assistantMessage = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
  if (!assistantMessage) {
    throw new HttpError('AI did not return a valid response.', 500);
  }

  const jsonText = extractJsonText(assistantMessage);
  const parsed = JSON.parse(jsonText);
  return normalizeInvoiceInput(parsed);
}

export async function generateInvoiceFromAI(token: string | undefined, description: string) {
  authenticate(token);

  const user = await getUserFromToken(token as string);
  const currentCount = await resetMessageCountIfNeeded(user.userid) ?? user.message_count;

  if (user.tier === 'standard' && currentCount >= STANDARD_MESSAGE_LIMIT) {
    throw new HttpError('Daily message limit reached. Upgrade to Pro for unlimited AI invoice generation.', 429);
  }

  const input = await requestInvoiceInputFromAI(token as string, description, STANDARD_SYSTEM_PROMPT, false);

  // Additional validation to ensure AI provided complete data
  try {
    validateInvoiceInput(input);
  } catch (validationError) {
    throw new HttpError(`AI could not generate a complete invoice. Please provide more details`, 400);
  }

  const result = await generateInvoiceFromInput(input, token);

  if (user.tier === 'standard') {
    await incrementMessageCount(user.userid);
  }

  return result;
}

export async function generateInvoicePrefill(token: string | undefined, description: string) {
  authenticate(token);

  const user = await getUserFromToken(token as string);
  if (user.tier !== 'pro') {
    throw new HttpError('Autofill is only available for Pro users.', 403);
  }

  const input = await requestInvoiceInputFromAI(token as string, description, PRO_SYSTEM_PROMPT, true);

  // For pro users, we still validate but return the draft even if incomplete
  // The frontend can handle showing validation errors
  return {
    draft: input,
    message: 'Invoice draft generated successfully.',
  };
}
