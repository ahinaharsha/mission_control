import { describe, expect, test, afterAll, beforeAll } from '@jest/globals';
import request from 'supertest';
import { app, server } from '../server';
import pool from '../AWS/datastore';
import { authLogin, authRegister } from '../AWS/auth/auth';

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

  await request(app)
    .post('/invoices')
    .set('token', token)
    .set('Content-Type', 'application/xml')
    .send(validxml);

  const result = await pool.query(
    `SELECT invoiceId FROM invoices ORDER BY invoiceId DESC LIMIT 1`
  );
  invoiceId = result.rows[0].invoiceid;
}, 30000);

afterAll(async () => {
  server.close();
  await pool.end();
}, 30000);

describe('GET /invoices/:id/pdf', () => {
  test('Returns PDF even with missing XML fields', async () => {
  const incompleteXML = `<?xml version="1.0" encoding="UTF-8"?><Invoice></Invoice>`;
  await pool.query(
    `INSERT INTO invoices (invoiceId, userId, invoiceXML, status) VALUES ('11111111-1111-1111-1111-111111111111', (SELECT userId FROM users WHERE token = $1), $2, 'Generated')`,
    [token, incompleteXML]
  );
  const res = await request(app)
    .get(`/invoices/11111111-1111-1111-1111-111111111111/pdf`)
    .set('token', token);
  expect(res.statusCode).toStrictEqual(200);
});

test('Returns PDF with empty XML tags', async () => {
  const emptyTagsXML = `<?xml version="1.0" encoding="UTF-8"?><Invoice><cbc:ID></cbc:ID></Invoice>`;
  await pool.query(
    `INSERT INTO invoices (invoiceId, userId, invoiceXML, status) VALUES ('22222222-2222-2222-2222-222222222222', (SELECT userId FROM users WHERE token = $1), $2, 'Generated')`,
    [token, emptyTagsXML]
  );
  const res = await request(app)
    .get(`/invoices/22222222-2222-2222-2222-222222222222/pdf`)
    .set('token', token);
  expect(res.statusCode).toStrictEqual(200);
});

  test('Returns 200 and a PDF for a valid invoice', async () => {
    const res = await request(app)
      .get(`/invoices/${invoiceId}/pdf`)
      .set('token', token);
    expect(res.statusCode).toStrictEqual(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(Buffer.from(res.body).subarray(0, 4).toString()).toStrictEqual('%PDF');
  });

  test('No token returns 401', async () => {
    const res = await request(app)
      .get(`/invoices/${invoiceId}/pdf`);
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invalid token returns 401', async () => {
    const res = await request(app)
      .get(`/invoices/${invoiceId}/pdf`)
      .set('token', 'invalidtoken');
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(401);
  });

  test('Invoice not found returns 404', async () => {
    const res = await request(app)
      .get(`/invoices/00000000-0000-0000-0000-000000000000/pdf`)
      .set('token', token);
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(404);
  });

  test('Wrong user returns 403', async () => {
    const otherEmail = `other-${Date.now()}@gmail.com`;
    await authRegister(otherEmail, 'correctpassword123');
    const otherLogin = await authLogin(otherEmail, 'correctpassword123');
    const res = await request(app)
      .get(`/invoices/${invoiceId}/pdf`)
      .set('token', otherLogin.token);
    expect(res.body).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(403);
  });
});