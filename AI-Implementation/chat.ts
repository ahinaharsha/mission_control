import Anthropic from '@anthropic-ai/sdk';
import pool from '../AWS/datastore';
import { HttpError } from '../class';
import { authenticate } from '../AWS/auth/auth';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { create_invoice, validateInvoiceInput } from '../invoice-generator/generator';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STANDARD_MESSAGE_LIMIT = 25;

const SYSTEM_PROMPT = `You are an expert invoicing assistant for MC Invoicing, a Peppol UBL-compliant invoice management platform. 
You help users with:
- Understanding invoicing concepts and best practices
- Explaining Peppol UBL standards and compliance requirements
- Answering questions about GST, tax, and currency
- Guiding users through creating, updating, and managing invoices
- Australian invoicing regulations and requirements
Keep responses concise, professional, and relevant to invoicing.`;

const INVOICE_GENERATION_PROMPT = `You are an expert invoicing assistant for MC Invoicing, a Peppol UBL-compliant invoice management platform.
The user will describe an invoice in natural language. You must extract the invoice details and return ONLY a valid JSON object with no preamble, no markdown, no backticks.
The JSON must follow this exact structure:
{
  "customer": {
    "id": "string",
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "billingAddress": {
      "street": "string",
      "city": "string",
      "postcode": "string",
      "country": "string"
    },
    "shippingAddress": {
      "street": "string",
      "city": "string",
      "postcode": "string",
      "country": "string"
    }
  },
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "rate": number
    }
  ],
  "currency": "AUD",
  "tax": {
    "taxId": "GST",
    "countryCode": "AU",
    "taxPercentage": 10
  },
  "from": {
    "businessName": "string",
    "address": {
      "street": "string",
      "city": "string",
      "postcode": "string",
      "country": "string"
    },
    "taxId": "string",
    "abnNumber": "string",
    "dueDate": "YYYY-MM-DD"
  }
}
If any information is missing, use sensible defaults. Always return valid JSON only.`;

async function getUserFromToken(token: string) {
  const decoded = jwt.decode(token) as { userId: string };
  const result = await pool.query(
    `SELECT userId, tier, message_count, last_reset_date FROM users WHERE userId = $1`,
    [decoded.userId]
  );
  if (result.rows.length === 0) {
    throw new HttpError('User not found.', 404);
  }
  return result.rows[0];
}

async function resetMessageCountIfNeeded(userId: string) {
  const result = await pool.query(
    `UPDATE users SET message_count = 0, last_reset_date = CURRENT_DATE 
     WHERE userId = $1 AND last_reset_date < CURRENT_DATE
     RETURNING message_count`,
    [userId]
  );
  return result.rows.length > 0 ? 0 : null;
}

async function getChatHistory(userId: string) {
  const result = await pool.query(
    `SELECT role, content FROM chat_history WHERE userId = $1 ORDER BY createdAt ASC`,
    [userId]
  );
  return result.rows.map(row => ({
    role: row.role as 'user' | 'assistant',
    content: row.content
  }));
}

async function saveChatHistory(userId: string, role: string, content: string) {
  await pool.query(
    `INSERT INTO chat_history (id, userId, role, content) VALUES ($1, $2, $3, $4)`,
    [uuidv4(), userId, role, content]
  );
}

export async function chat(token: string | undefined, message: string) {
  authenticate(token);

  const user = await getUserFromToken(token as string);
  const userId = user.userid;
  const tier = user.tier;

  const resetCount = await resetMessageCountIfNeeded(userId);
  const currentCount = resetCount !== null ? resetCount : user.message_count;

  if (tier === 'standard' && currentCount >= STANDARD_MESSAGE_LIMIT) {
    throw new HttpError('Daily message limit reached. Upgrade to Pro for unlimited messages.', 429);
  }

  const history = tier === 'pro' ? await getChatHistory(userId) : [];

  const messages = [...history, { role: 'user' as const, content: message }];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages
  });

  const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

  if (tier === 'pro') {
    await saveChatHistory(userId, 'user', message);
    await saveChatHistory(userId, 'assistant', assistantMessage);
  }

  if (tier === 'standard') {
    await pool.query(
      `UPDATE users SET message_count = message_count + 1 WHERE userId = $1`,
      [userId]
    );
  }

  return {
    message: assistantMessage,
    tier,
    messagesRemaining: tier === 'standard' ? STANDARD_MESSAGE_LIMIT - currentCount - 1 : null
  };
}

export async function clearChatHistory(token: string | undefined) {
  authenticate(token);
  const user = await getUserFromToken(token as string);

  if (user.tier !== 'pro') {
    throw new HttpError('Chat history is only available for Pro users.', 403);
  }

  await pool.query(`DELETE FROM chat_history WHERE userId = $1`, [user.userid]);
  return { message: 'Chat history cleared.' };
}

export async function generateInvoiceFromAI(token: string | undefined, description: string) {
  authenticate(token);

  const user = await getUserFromToken(token as string);
  const userId = user.userid;
  const tier = user.tier;

  // Check message limit for standard users
  const resetCount = await resetMessageCountIfNeeded(userId);
  const currentCount = resetCount !== null ? resetCount : user.message_count;

  if (tier === 'standard' && currentCount >= STANDARD_MESSAGE_LIMIT) {
    throw new HttpError('Daily message limit reached. Upgrade to Pro for unlimited messages.', 429);
  }

  // Call Anthropic API
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: INVOICE_GENERATION_PROMPT,
    messages: [{ role: 'user', content: description }]
  });

  const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

  // Parse the JSON response
  let invoiceInput: any;
  try {
    const clean = responseText.replace(/```json|```/g, '').trim();
    invoiceInput = JSON.parse(clean);
    if (invoiceInput.from?.dueDate) {
      invoiceInput.from.dueDate = new Date(invoiceInput.from.dueDate);
    }
  } catch (e) {
    throw new HttpError('AI failed to generate valid invoice data. Please try again with more details.', 500);
  }

  // Validate the invoice input
  validateInvoiceInput(invoiceInput);

  // Generate Peppol UBL XML
  const invoiceXML = create_invoice(invoiceInput);
  const invoiceId = uuidv4();

  // Save to database
  await pool.query(
    `INSERT INTO invoices (invoiceId, userId, invoiceXML, invoiceData, status) VALUES ($1, $2, $3, $4, $5)`,
    [invoiceId, userId, invoiceXML, JSON.stringify(invoiceInput), 'Generated']
  );

  // Increment message count for standard users
  if (tier === 'standard') {
    await pool.query(
      `UPDATE users SET message_count = message_count + 1 WHERE userId = $1`,
      [userId]
    );
  }

  return {
    message: 'Invoice generated successfully.',
    invoiceId,
    invoiceData: invoiceInput
  };
}

export async function autofillInvoiceFromAI(token: string | undefined, description: string) {
  authenticate(token);

  const user = await getUserFromToken(token as string);
  const tier = user.tier;

  if (tier !== 'pro') {
    throw new HttpError('Autofill is only available for Pro users.', 403);
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: INVOICE_GENERATION_PROMPT,
    messages: [{ role: 'user', content: description }]
  });

  const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

  // Parse the JSON response
  let invoiceInput: any;
  try {
    const clean = responseText.replace(/```json|```/g, '').trim();
    invoiceInput = JSON.parse(clean);
    if (invoiceInput.from?.dueDate) {
      invoiceInput.from.dueDate = new Date(invoiceInput.from.dueDate);
    }
  } catch (e) {
    throw new HttpError('AI failed to generate valid invoice data. Please try again with more details.', 500);
  }

  return {
    message: 'Invoice fields generated successfully. Please review and submit.',
    invoiceData: invoiceInput
  };
}

export async function updateInvoiceFromAI(token: string | undefined, invoiceId: string, description: string) {
  authenticate(token);

  const user = await getUserFromToken(token as string);
  const userId = user.userid;
  const tier = user.tier;

  if (tier !== 'pro') {
    throw new HttpError('AI invoice update is only available for Pro users.', 403);
  }

  // Fetch existing invoice
  const invoiceResult = await pool.query(
    `SELECT invoiceData, status, userId FROM invoices WHERE invoiceId = $1`,
    [invoiceId]
  );

  if (invoiceResult.rows.length === 0) {
    throw new HttpError('Invoice not found.', 404);
  }

  if (invoiceResult.rows[0].userid !== userId) {
    throw new HttpError('Forbidden.', 403);
  }

  const blockedStatuses = ['Sent', 'Paid', 'Overdue', 'Deleted'];
  if (blockedStatuses.includes(invoiceResult.rows[0].status)) {
    throw new HttpError('Cannot update a finalised invoice.', 409);
  }

  const existingData = invoiceResult.rows[0].invoicedata;

  // Call Anthropic API with existing invoice data as context
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: INVOICE_GENERATION_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here is the existing invoice data: ${JSON.stringify(existingData)}. 
        Please update it based on this instruction: ${description}. 
        Return the complete updated invoice as a JSON object only.`
      }
    ]
  });

  const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

  // Parse the JSON response
  let updatedInput: any;
  try {
    const clean = responseText.replace(/```json|```/g, '').trim();
    updatedInput = JSON.parse(clean);
    if (updatedInput.from?.dueDate) {
      updatedInput.from.dueDate = new Date(updatedInput.from.dueDate);
    }
  } catch (e) {
    throw new HttpError('AI failed to generate valid invoice data. Please try again with more details.', 500);
  }

  return {
    message: 'Invoice fields updated successfully. Please review and submit.',
    invoiceData: updatedInput
  };
}