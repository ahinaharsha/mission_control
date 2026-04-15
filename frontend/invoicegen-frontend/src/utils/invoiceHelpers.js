export function escapeXML(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function validateForm(form) {
  const errors = [];
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const postcodeRx = /^\d+$/;
  if (form.fromEmail && !emailRx.test(form.fromEmail)) errors.push('From email is not valid (must contain @).');
  if (form.toEmail && !emailRx.test(form.toEmail)) errors.push('To email is not valid (must contain @).');
  if (form.fromPostcode && !postcodeRx.test(form.fromPostcode)) errors.push('From postcode must be numbers only.');
  if (form.toPostcode && !postcodeRx.test(form.toPostcode)) errors.push('To postcode must be numbers only.');
  return errors;
}

export function generateXML(form) {
  const date = new Date().toISOString().split('T')[0];
  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;
  const itemsXML = form.items.filter(i => i.desc).map((i, idx) => {
    const amount = (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0);
    return `    <item index="${idx + 1}">
      <description>${escapeXML(i.desc)}</description>
      <quantity>${i.qty || 0}</quantity>
      <unitRate>${(parseFloat(i.rate) || 0).toFixed(2)}</unitRate>
      <amount>${amount.toFixed(2)}</amount>
    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<invoice>
  <meta>
    <date>${date}</date>
    <currency>AUD</currency>
  </meta>
  <billFrom>
    <name>${escapeXML(form.fromName)}</name>
    <email>${escapeXML(form.fromEmail)}</email>
    <address>${escapeXML(form.fromAddress)}</address>
    <postcode>${escapeXML(form.fromPostcode)}</postcode>
  </billFrom>
  <billTo>
    <name>${escapeXML(form.toName)}</name>
    <email>${escapeXML(form.toEmail)}</email>
    <address>${escapeXML(form.toAddress)}</address>
    <postcode>${escapeXML(form.toPostcode)}</postcode>
  </billTo>
  <lineItems>
${itemsXML}
  </lineItems>
  <totals>
    <subtotal>${subtotal.toFixed(2)}</subtotal>
    <gst rate="10%">${gst.toFixed(2)}</gst>
    <total>${total.toFixed(2)}</total>
  </totals>
</invoice>`;
}

export function downloadXML(xml) {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'invoice.xml'; a.click();
  URL.revokeObjectURL(url);
}

// grabs text content by tag name, searching within a parent element or the whole doc
function getText(docOrEl, tag) {
  const els = docOrEl.getElementsByTagName(tag);
  if (els.length > 0) return els[0].textContent?.trim() ?? '';
  return '';
}

export function parseXMLToInvoice(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr.trim(), 'text/xml');

  const parseErr = doc.getElementsByTagName('parsererror');
  if (parseErr.length > 0) throw new Error('Invalid XML — check your markup.');

  // Helper: get text by local name, ignoring namespace prefix
  const byLocal = (parent, localName) => {
    const all = parent.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName === localName) return all[i].textContent?.trim() ?? '';
    }
    return '';
  };

  const byLocalEl = (parent, localName) => {
    const all = parent.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName === localName) return all[i];
    }
    return null;
  };

  // Detect format: MC Invoicing vs UBL
  const isUBL = !!doc.getElementsByTagName('*')[0]?.namespaceURI;

  if (isUBL) {
    // ── UBL format ──
    const buyerEl  = byLocalEl(doc, 'BuyerCustomerParty')  ?? byLocalEl(doc, 'AccountingCustomerParty');
    const sellerEl = byLocalEl(doc, 'SellerSupplierParty') ?? byLocalEl(doc, 'AccountingSupplierParty');

    const partyName = (partyEl) => {
      if (!partyEl) return '';
      return byLocal(partyEl, 'Name');
    };
    const partyAddress = (partyEl) => {
      if (!partyEl) return '';
      const street = byLocal(partyEl, 'StreetName');
      const city   = byLocal(partyEl, 'CityName');
      return [street, city].filter(Boolean).join(', ');
    };
    const partyPostcode = (partyEl) => partyEl ? byLocal(partyEl, 'PostalZone') : '';
    const partyEmail    = (partyEl) => partyEl ? byLocal(partyEl, 'ElectronicMail') : '';

    const items = [];
    const orderLines = doc.getElementsByTagName('*');
    for (let i = 0; i < orderLines.length; i++) {
      const el = orderLines[i];
      if (el.localName === 'OrderLine' || el.localName === 'InvoiceLine') {
        const desc = byLocal(el, 'Description') || byLocal(el, 'Name');
        const qty  = byLocal(el, 'Quantity')    || byLocal(el, 'InvoicedQuantity') || '1';
        const amt  = byLocal(el, 'LineExtensionAmount') || byLocal(el, 'PriceAmount') || '';
        const rate = byLocal(el, 'PriceAmount') || amt;
        if (desc || amt) items.push({ desc, qty, rate, amt });
      }
    }

    // Currency
    const currency = (() => {
      const all = doc.getElementsByTagName('*');
      for (let i = 0; i < all.length; i++) {
        const c = all[i].getAttribute('currencyID');
        if (c) return c;
      }
      return 'AUD';
    })();

    // Totals
    const total    = byLocal(doc, 'TaxInclusiveAmount') || byLocal(doc, 'LegalMonetaryTotal') && byLocal(byLocalEl(doc, 'LegalMonetaryTotal'), 'TaxInclusiveAmount') || byLocal(doc, 'PayableAmount') || '';
    const subtotal = byLocal(doc, 'LineExtensionAmount') || '';
    const gst      = byLocal(doc, 'TaxAmount') || '';

    return {
      date:         byLocal(doc, 'IssueDate'),
      currency,
      fromName:     partyName(sellerEl),
      fromEmail:    partyEmail(sellerEl),
      fromAddress:  partyAddress(sellerEl),
      fromPostcode: partyPostcode(sellerEl),
      toName:       partyName(buyerEl),
      toEmail:      partyEmail(buyerEl),
      toAddress:    partyAddress(buyerEl),
      toPostcode:   partyPostcode(buyerEl),
      subtotal,
      gst,
      total,
      items,
    };
  }

  // ── MC Invoicing format ──
  const getText = (parent, tag) => {
    const els = parent.getElementsByTagName(tag);
    return els.length > 0 ? els[0].textContent?.trim() ?? '' : '';
  };

  const billFrom = doc.getElementsByTagName('billFrom')[0] ?? doc;
  const billTo   = doc.getElementsByTagName('billTo')[0]   ?? doc;
  const meta     = doc.getElementsByTagName('meta')[0]     ?? doc;
  const totals   = doc.getElementsByTagName('totals')[0]   ?? doc;

  const items = [];
  const itemEls = doc.getElementsByTagName('item');
  for (let i = 0; i < itemEls.length; i++) {
    const el = itemEls[i];
    items.push({
      desc: getText(el, 'description'),
      qty:  getText(el, 'quantity'),
      rate: getText(el, 'unitRate'),
      amt:  getText(el, 'amount'),
    });
  }

  return {
    date:         getText(meta,     'date'),
    currency:     getText(meta,     'currency') || 'AUD',
    fromName:     getText(billFrom, 'name'),
    fromEmail:    getText(billFrom, 'email'),
    fromAddress:  getText(billFrom, 'address'),
    fromPostcode: getText(billFrom, 'postcode'),
    toName:       getText(billTo,   'name'),
    toEmail:      getText(billTo,   'email'),
    toAddress:    getText(billTo,   'address'),
    toPostcode:   getText(billTo,   'postcode'),
    subtotal:     getText(totals,   'subtotal'),
    gst:          getText(totals,   'gst'),
    total:        getText(totals,   'total'),
    items,
  };
}

export function parseJSONToInvoice(jsonStr) {
  const d = JSON.parse(jsonStr);
  const currency = d.meta?.currency ?? d.currency ?? 'AUD';
  const date     = d.meta?.date     ?? d.date     ?? '';
  const from = d.billFrom ?? d.from ?? {};
  const to   = d.billTo   ?? d.to   ?? {};
  const rawItems = d.lineItems ?? d.items ?? d.line_items ?? [];
  const items = rawItems.map((i) => ({
    desc: i.description ?? i.desc ?? '',
    qty:  String(i.quantity  ?? i.qty  ?? ''),
    rate: String(i.unitRate  ?? i.rate ?? ''),
    amt:  String(i.amount    ?? i.amt  ?? ''),
  }));
  const totals = d.totals ?? {};
  return {
    date, currency,
    fromName: from.name ?? '', fromEmail: from.email ?? '',
    fromAddress: from.address ?? '', fromPostcode: from.postcode ?? '',
    toName: to.name ?? '', toEmail: to.email ?? '',
    toAddress: to.address ?? '', toPostcode: to.postcode ?? '',
    subtotal: String(totals.subtotal ?? d.subtotal ?? ''),
    gst:      String(totals.gst      ?? d.gst      ?? ''),
    total:    String(totals.total    ?? d.total    ?? ''),
    items,
  };
}

export function buildAndPrintPDF(inv) {
  const itemRows = inv.items.filter((i) => i.desc).map((i) => `<tr>
    <td style="padding:7px 8px;border-bottom:1px solid #ccc;font-size:9pt;">${escapeXML(i.desc)}</td>
    <td style="padding:7px 8px;border-bottom:1px solid #ccc;text-align:right;font-size:9pt;">${escapeXML(i.qty)}</td>
    <td style="padding:7px 8px;border-bottom:1px solid #ccc;text-align:right;font-size:9pt;">${escapeXML(i.rate)}</td>
    <td style="padding:7px 8px;border-bottom:1px solid #ccc;text-align:right;font-size:9pt;">${escapeXML(i.amt)}</td>
  </tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Helvetica,Arial,sans-serif;font-size:10pt;color:#222;background:#fff;padding:50px;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;}
  .invoice-title{font-size:22pt;font-weight:700;letter-spacing:.02em;color:#111;}
  .meta-table{font-size:9pt;color:#444;text-align:right;line-height:1.8;}
  .meta-label{color:#888;}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:28px;}
  .party-label{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:6px;}
  .party-name{font-size:11pt;font-weight:700;color:#111;margin-bottom:2px;}
  .party-detail{font-size:9pt;color:#555;line-height:1.6;}
  hr{border:none;border-top:1px solid #ccc;margin:0 0 16px;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  thead tr{border-top:1px solid #ccc;border-bottom:1px solid #ccc;}
  th{padding:8px;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#666;text-align:left;}
  th:nth-child(2),th:nth-child(3),th:nth-child(4){text-align:right;}
  .totals{margin-left:auto;width:260px;border-top:1px solid #ccc;padding-top:10px;}
  .total-row{display:flex;justify-content:space-between;padding:3px 0;font-size:9pt;color:#555;}
  .total-final{display:flex;justify-content:space-between;padding:8px 0 0;font-size:11pt;font-weight:700;color:#111;border-top:1px solid #ccc;margin-top:6px;}
  .footer{margin-top:48px;font-size:8pt;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:12px;}
</style></head><body>
  <div class="header">
    <div class="invoice-title">INVOICE</div>
    <table class="meta-table" style="border:none;">
      ${inv.date ? `<tr><td class="meta-label">Issue Date:&nbsp;</td><td>${escapeXML(inv.date)}</td></tr>` : ''}
      <tr><td class="meta-label">Currency:&nbsp;</td><td>${escapeXML(inv.currency)}</td></tr>
    </table>
  </div>
  <div class="parties">
    <div>
      <div class="party-label">From</div>
      <div class="party-name">${escapeXML(inv.fromName)}</div>
      ${inv.fromEmail    ? `<div class="party-detail">${escapeXML(inv.fromEmail)}</div>`    : ''}
      ${inv.fromAddress  ? `<div class="party-detail">${escapeXML(inv.fromAddress)}</div>`  : ''}
      ${inv.fromPostcode ? `<div class="party-detail">${escapeXML(inv.fromPostcode)}</div>` : ''}
    </div>
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${escapeXML(inv.toName)}</div>
      ${inv.toEmail    ? `<div class="party-detail">${escapeXML(inv.toEmail)}</div>`    : ''}
      ${inv.toAddress  ? `<div class="party-detail">${escapeXML(inv.toAddress)}</div>`  : ''}
      ${inv.toPostcode ? `<div class="party-detail">${escapeXML(inv.toPostcode)}</div>` : ''}
    </div>
  </div>
  <hr />
  <table>
    <thead><tr>
      <th style="width:50%">Description</th><th style="width:12%">Qty</th>
      <th style="width:18%">Rate</th><th style="width:20%">Amount</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    ${inv.subtotal ? `<div class="total-row"><span>Subtotal</span><span>${escapeXML(inv.currency)} ${escapeXML(inv.subtotal)}</span></div>` : ''}
    ${inv.gst      ? `<div class="total-row"><span>Tax (GST 10%)</span><span>${escapeXML(inv.currency)} ${escapeXML(inv.gst)}</span></div>` : ''}
    ${inv.total    ? `<div class="total-final"><span>Total</span><span>${escapeXML(inv.currency)} ${escapeXML(inv.total)}</span></div>`     : ''}
  </div>
  <div class="footer">Payment due within 30 days. Thank you for your business.</div>
</body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

export function downloadPDF(form) {
  const date = new Date().toISOString().split('T')[0];
  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;
  const itemRows = form.items.filter(i => i.desc).map(i => {
    const amt = (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0);
    return `<tr>
      <td style="padding:7px 8px;border-bottom:1px solid #cccccc;font-size:9pt;">${escapeXML(i.desc)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #cccccc;text-align:right;font-size:9pt;">${i.qty || 0}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #cccccc;text-align:right;font-size:9pt;">${(parseFloat(i.rate)||0).toFixed(2)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #cccccc;text-align:right;font-size:9pt;">${amt.toFixed(2)}</td>
    </tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #222; background: #fff; padding: 50px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .invoice-title { font-size: 22pt; font-weight: 700; letter-spacing: 0.02em; color: #111; }
  .meta-table { font-size: 9pt; color: #444; text-align: right; line-height: 1.8; }
  .meta-label { color: #888; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
  .party-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; }
  .party-name { font-size: 11pt; font-weight: 700; color: #111; margin-bottom: 2px; }
  .party-detail { font-size: 9pt; color: #555; line-height: 1.6; }
  .divider { border: none; border-top: 1px solid #ccc; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
  th { padding: 8px; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; text-align: left; }
  th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
  .totals { margin-left: auto; width: 260px; border-top: 1px solid #ccc; padding-top: 10px; }
  .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 9pt; color: #555; }
  .total-final { display: flex; justify-content: space-between; padding: 8px 0 0; font-size: 11pt; font-weight: 700; color: #111; border-top: 1px solid #ccc; margin-top: 6px; }
  .footer { margin-top: 48px; font-size: 8pt; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
</style></head><body>
  <div class="header">
    <div class="invoice-title">INVOICE</div>
    <table class="meta-table" style="border:none;">
      <tr><td class="meta-label">Issue Date:&nbsp;</td><td>${date}</td></tr>
      <tr><td class="meta-label">Currency:&nbsp;</td><td>AUD</td></tr>
    </table>
  </div>
  <div class="parties">
    <div>
      <div class="party-label">From</div>
      <div class="party-name">${escapeXML(form.fromName)}</div>
      ${form.fromEmail    ? `<div class="party-detail">${escapeXML(form.fromEmail)}</div>`    : ''}
      ${form.fromAddress  ? `<div class="party-detail">${escapeXML(form.fromAddress)}</div>`  : ''}
      ${form.fromPostcode ? `<div class="party-detail">${escapeXML(form.fromPostcode)}</div>` : ''}
    </div>
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${escapeXML(form.toName)}</div>
      ${form.toEmail    ? `<div class="party-detail">${escapeXML(form.toEmail)}</div>`    : ''}
      ${form.toAddress  ? `<div class="party-detail">${escapeXML(form.toAddress)}</div>`  : ''}
      ${form.toPostcode ? `<div class="party-detail">${escapeXML(form.toPostcode)}</div>` : ''}
    </div>
  </div>
  <hr class="divider" />
  <table>
    <thead><tr>
      <th style="width:50%">Description</th>
      <th style="width:12%">Qty</th>
      <th style="width:18%">Rate</th>
      <th style="width:20%">Amount</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>AUD ${subtotal.toFixed(2)}</span></div>
    <div class="total-row"><span>Tax (GST 10%)</span><span>AUD ${gst.toFixed(2)}</span></div>
    <div class="total-final"><span>Total</span><span>AUD ${total.toFixed(2)}</span></div>
  </div>
  <div class="footer">Payment due within 30 days. Thank you for your business.</div>
</body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}