/**
 * Builds UBL 2.0 Order XML from invoice form data.
 * Matches the structure expected by parseOrderXML() in generator.ts.
 */
export function buildOrderXML({ from, customer, lineItems, currency }) {
  const firstItem = lineItems[0] || { description: '', quantity: 1, rate: 0 };

  return `<?xml version="1.0" encoding="UTF-8"?>
<Order
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns="urn:oasis:names:specification:ubl:schema:xsd:Order-2">

  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:ID>INV-${Date.now()}</cbc:ID>
  <cbc:IssueDate>${new Date().toISOString().split('T')[0]}</cbc:IssueDate>

  <cac:BuyerCustomerParty>
    <cbc:CustomerAssignedAccountID>${escXml(customer.id || 'CUST-001')}</cbc:CustomerAssignedAccountID>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escXml(customer.fullName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escXml(customer.billingAddress.street)}</cbc:StreetName>
        <cbc:CityName>${escXml(customer.billingAddress.city)}</cbc:CityName>
        <cbc:PostalZone>${escXml(customer.billingAddress.postcode)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escXml(customer.billingAddress.country)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:Telephone>${escXml(customer.phone)}</cbc:Telephone>
        <cbc:ElectronicMail>${escXml(customer.email)}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:BuyerCustomerParty>

  <cac:SellerSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escXml(from.businessName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escXml(from.address.street)}</cbc:StreetName>
        <cbc:CityName>${escXml(from.address.city)}</cbc:CityName>
        <cbc:PostalZone>${escXml(from.address.postcode)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${escXml(from.address.country)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escXml(from.abnNumber)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>GST</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:SellerSupplierParty>

  <cac:AnticipatedMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${escXml(currency)}">${(firstItem.quantity * firstItem.rate).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:PayableAmount currencyID="${escXml(currency)}">${(firstItem.quantity * firstItem.rate).toFixed(2)}</cbc:PayableAmount>
  </cac:AnticipatedMonetaryTotal>

  <cac:OrderLine>
    <cac:LineItem>
      <cbc:ID>1</cbc:ID>
      <cbc:Quantity unitCode="EA">${firstItem.quantity}</cbc:Quantity>
      <cbc:LineExtensionAmount currencyID="${escXml(currency)}">${(firstItem.quantity * firstItem.rate).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Price>
        <cbc:PriceAmount currencyID="${escXml(currency)}">${firstItem.rate}</cbc:PriceAmount>
      </cac:Price>
      <cac:Item>
        <cbc:Description>${escXml(firstItem.description)}</cbc:Description>
        <cbc:Name>${escXml(firstItem.description)}</cbc:Name>
      </cac:Item>
    </cac:LineItem>
  </cac:OrderLine>

</Order>`;
}

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
