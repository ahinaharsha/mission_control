import pool from '../AWS/datastore';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { authLogin, authRegister } from '../AWS/auth/auth';

const SERVER_URL = 'http://localhost:3000';

async function request(method: string, url: string, options?: { json?: any; headers?: Record<string, string> }) {
  const parsed = new URL(url);
  const lib = parsed.protocol === 'https:' ? https : http;
  const body = options?.json !== undefined
    ? typeof options.json === 'string'
      ? options.json
      : JSON.stringify(options.json)
    : undefined;

  const headers = {
    ...(options?.headers ?? {}),
    ...(body
      ? {
          'Content-Type': typeof options?.json === 'string' ? 'application/xml' : 'application/json',
          'Content-Length': Buffer.byteLength(body).toString(),
        }
      : {}),
  };

  const reqOptions = {
    method,
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname + parsed.search,
    headers,
  };

  return new Promise<{ statusCode: number; body: Buffer; headers: any }>((resolve, reject) => {
    const req = lib.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body: Buffer.concat(chunks), headers: res.headers }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const validxml = `<?xml version="1.0" encoding="UTF-8"?>
<Order xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns="urn:oasis:names:specification:ubl:schema:xsd:Order-2">
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:ID>AEG012345</cbc:ID>
  <cbc:IssueDate>2005-06-20</cbc:IssueDate>
  <cac:BuyerCustomerParty>
    <cbc:CustomerAssignedAccountID>XFB01</cbc:CustomerAssignedAccountID>
    <cac:Party>
      <cac:PartyName><cbc:Name>IYT Corporation</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Avon Way</cbc:StreetName>
        <cbc:CityName>Bridgtow</cbc:CityName>
        <cbc:PostalZone>ZZ99 1ZZ</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>GB</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:Telephone>0127 2653214</cbc:Telephone>
        <cbc:ElectronicMail>fred@iytcorporation.gov.uk</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:BuyerCustomerParty>
  <cac:SellerSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Consortial</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Busy Street</cbc:StreetName>
        <cbc:CityName>Farthing</cbc:CityName>
        <cbc:PostalZone>AA99 1BB</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>GB</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>175 269 2355</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:SellerSupplierParty>
  <cac:OrderLine>
    <cac:LineItem>
      <cbc:Quantity unitCode="KGM">100</cbc:Quantity>
      <cbc:LineExtensionAmount currencyID="GBP">100.00</cbc:LineExtensionAmount>
      <cac:Price><cbc:PriceAmount currencyID="GBP">100.00</cbc:PriceAmount></cac:Price>
      <cac:Item><cbc:Description>Acme beeswax</cbc:Description></cac:Item>
    </cac:LineItem>
  </cac:OrderLine>
</Order>`;

let token: string;
let invoiceId: string;

beforeAll(async () => {
  await pool.query('DELETE FROM invoices');
  await pool.query('DELETE FROM users');

  const testEmail = `test-${Date.now()}@gmail.com`;
  await authRegister(testEmail, 'correctpassword123');
  const loginRes = await authLogin(testEmail, 'correctpassword123');
  token = loginRes.token;

  await request('POST', `${SERVER_URL}/invoices`, {
    headers: { token },
    json: validxml
  });

  const result = await pool.query(
    `SELECT invoiceId FROM invoices ORDER BY invoiceId DESC LIMIT 1`
  );
  invoiceId = result.rows[0].invoiceid;
});

afterAll(async () => {
  await pool.end();
}, 30000);

describe('GET /invoices/:id/pdf', () => {
  test('Returns 200 and a PDF for a valid invoice', async () => {
    const res = await request('GET', `${SERVER_URL}/invoices/${invoiceId}/pdf`, {
      headers: { token }
    });
    expect(res.statusCode).toStrictEqual(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.subarray(0, 4).toString()).toStrictEqual('%PDF');
  });

  test('No token returns 401', async () => {
    const res = await request('GET', `${SERVER_URL}/invoices/${invoiceId}/pdf`, {});
    const body = JSON.parse(res.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invalid token returns 401', async () => {
    const res = await request('GET', `${SERVER_URL}/invoices/${invoiceId}/pdf`, {
      headers: { token: 'invalidtoken' }
    });
    const body = JSON.parse(res.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invoice not found returns 404', async () => {
    const res = await request('GET', `${SERVER_URL}/invoices/00000000-0000-0000-0000-000000000000/pdf`, {
      headers: { token }
    });
    const body = JSON.parse(res.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(404);
  });

  test('Wrong user returns 403', async () => {
    const otherEmail = `other-${Date.now()}@gmail.com`;
    await authRegister(otherEmail, 'correctpassword123');
    const otherLogin = await authLogin(otherEmail, 'correctpassword123');
    const res = await request('GET', `${SERVER_URL}/invoices/${invoiceId}/pdf`, {
      headers: { token: otherLogin.token }
    });
    const body = JSON.parse(res.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(403);
  });
});