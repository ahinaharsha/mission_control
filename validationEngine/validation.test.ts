import { validateAddress, validateFromDetails, validateCustomer, validateLineItems, validateCurrency, validateTax } from '../validationEngine/validation';

describe('validateAddress', () => {
  test('valid address returns no errors', () => {
    const result = validateAddress({
      street: '123 Main St',
      city: 'Sydney',
      postcode: '2000',
      country: 'AU'
    });
    expect(result).toStrictEqual([]);
  });

  test('null address returns error', () => {
    const result = validateAddress(null as any);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].field).toStrictEqual(expect.any(String));
    expect(result[0].message).toStrictEqual(expect.any(String));
  });

  test('missing street returns error', () => {
    const result = validateAddress({
      street: '',
      city: 'Sydney',
      postcode: '2000',
      country: 'AU'
    });
    expect(result.some(e => e.field === 'street')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing city returns error', () => {
    const result = validateAddress({
      street: '123 Main St',
      city: '',
      postcode: '2000',
      country: 'AU'
    });
    expect(result.some(e => e.field === 'city')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing postcode returns error', () => {
    const result = validateAddress({
      street: '123 Main St',
      city: 'Sydney',
      postcode: '',
      country: 'AU'
    });
    expect(result.some(e => e.field === 'postcode')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing country returns error', () => {
    const result = validateAddress({
      street: '123 Main St',
      city: 'Sydney',
      postcode: '2000',
      country: ''
    });
    expect(result.some(e => e.field === 'country')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing from address street returns error', () => {
    const result = validateFromDetails({
        businessName: 'ABC Electronics',
        address: {
        street: '',
        city: 'Sydney',
        postcode: '2000',
        country: 'AU'
        },
        taxId: 'ABN123456',
        abnNumber: '05959203020',
        dueDate: new Date('2026-07-01')
    });
    expect(result.some(e => e.field === 'from.address.street')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    });
});

describe('validateFromDetails', () => {
  test('valid from details returns no errors', () => {
    const result = validateFromDetails({
      businessName: 'ABC Electronics',
      address: {
        street: '14 Campbell St',
        city: 'Sydney',
        postcode: '2000',
        country: 'AU'
      },
      taxId: 'ABN123456',
      abnNumber: '05959203020',
      dueDate: new Date('2026-07-01')
    });
    expect(result).toStrictEqual([]);
  });

  test('null from returns error', () => {
    const result = validateFromDetails(null as any);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].field).toStrictEqual(expect.any(String));
    expect(result[0].message).toStrictEqual(expect.any(String));
  });

  test('missing businessName returns error', () => {
    const result = validateFromDetails({
      businessName: '',
      address: {
        street: '14 Campbell St',
        city: 'Sydney',
        postcode: '2000',
        country: 'AU'
      },
      taxId: 'ABN123456',
      abnNumber: '05959203020',
      dueDate: new Date('2026-07-01')
    });
    expect(result.some(e => e.field === 'from.businessName')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing taxId returns error', () => {
    const result = validateFromDetails({
      businessName: 'ABC Electronics',
      address: {
        street: '14 Campbell St',
        city: 'Sydney',
        postcode: '2000',
        country: 'AU'
      },
      taxId: '',
      abnNumber: '05959203020',
      dueDate: new Date('2026-07-01')
    });
    expect(result.some(e => e.field === 'from.taxId')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing abnNumber returns error', () => {
    const result = validateFromDetails({
      businessName: 'ABC Electronics',
      address: {
        street: '14 Campbell St',
        city: 'Sydney',
        postcode: '2000',
        country: 'AU'
      },
      taxId: 'ABN123456',
      abnNumber: '',
      dueDate: new Date('2026-07-01')
    });
    expect(result.some(e => e.field === 'from.abnNumber')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('validateCustomer', () => {
  test('valid customer returns no errors', () => {
    const result = validateCustomer({
      id: 'CUST-001',
      fullName: 'John Smith',
      email: 'john@gmail.com',
      phone: '+61400000000',
      billingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      },
      shippingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      }
    });
    expect(result).toStrictEqual([]);
  });

  test('null customer returns error', () => {
    const result = validateCustomer(null as any);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].field).toStrictEqual(expect.any(String));
    expect(result[0].message).toStrictEqual(expect.any(String));
  });

  test('missing fullName returns error', () => {
    const result = validateCustomer({
      id: 'CUST-001',
      fullName: '',
      email: 'john@gmail.com',
      phone: '+61400000000',
      billingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      },
      shippingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      }
    });
    expect(result.some(e => e.field === 'customer.fullName')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('invalid email returns error', () => {
    const result = validateCustomer({
      id: 'CUST-001',
      fullName: 'John Smith',
      email: 'notanemail',
      phone: '+61400000000',
      billingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      },
      shippingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      }
    });
    expect(result.some(e => e.field === 'customer.email')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing email returns error', () => {
    const result = validateCustomer({
      id: 'CUST-001',
      fullName: 'John Smith',
      email: '',
      phone: '+61400000000',
      billingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      },
      shippingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      }
    });
    expect(result.some(e => e.field === 'customer.email')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('invalid phone returns error', () => {
    const result = validateCustomer({
      id: 'CUST-001',
      fullName: 'John Smith',
      email: 'john@gmail.com',
      phone: '123',
      billingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      },
      shippingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      }
    });
    expect(result.some(e => e.field === 'customer.phone')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing billing address returns error', () => {
    const result = validateCustomer({
      id: 'CUST-001',
      fullName: 'John Smith',
      email: 'john@gmail.com',
      phone: '+61400000000',
      billingAddress: null as any,
      shippingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      }
    });
    expect(result.some(e => e.field === 'billingAddress.address')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing shipping address returns error', () => {
    const result = validateCustomer({
      id: 'CUST-001',
      fullName: 'John Smith',
      email: 'john@gmail.com',
      phone: '+61400000000',
      billingAddress: {
        street: '25 King St',
        city: 'Melbourne',
        postcode: '3000',
        country: 'AU'
      },
      shippingAddress: null as any
    });
    expect(result.some(e => e.field === 'shippingAddress.address')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('validateLineItems', () => {
  test('valid line items returns no errors', () => {
    const result = validateLineItems([{
      description: 'Laptop',
      quantity: 1,
      rate: 1000
    }]);
    expect(result).toStrictEqual([]);
  });

  test('empty array returns error', () => {
    const result = validateLineItems([]);
    expect(result.some(e => e.field === 'lineItems')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing description returns error', () => {
    const result = validateLineItems([{
      description: '',
      quantity: 1,
      rate: 1000
    }]);
    expect(result.some(e => e.field === 'lineItem[0].description')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('quantity of 0 returns error', () => {
    const result = validateLineItems([{
      description: 'Laptop',
      quantity: 0,
      rate: 1000
    }]);
    expect(result.some(e => e.field === 'lineItem[0].quantity')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('negative quantity returns error', () => {
    const result = validateLineItems([{
      description: 'Laptop',
      quantity: -1,
      rate: 1000
    }]);
    expect(result.some(e => e.field === 'lineItem[0].quantity')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('rate of 0 returns error', () => {
    const result = validateLineItems([{
      description: 'Laptop',
      quantity: 1,
      rate: 0
    }]);
    expect(result.some(e => e.field === 'lineItem[0].rate')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('negative rate returns error', () => {
    const result = validateLineItems([{
      description: 'Laptop',
      quantity: 1,
      rate: -1
    }]);
    expect(result.some(e => e.field === 'lineItem[0].rate')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('validateCurrency', () => {
  test('valid currency returns no errors', () => {
    const result = validateCurrency('AUD');
    expect(result).toStrictEqual([]);
  });

  test('invalid currency code returns error', () => {
    const result = validateCurrency('invalid');
    expect(result.some(e => e.field === 'currency')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('invalid base currency returns error', () => {
    const result = validateCurrency('AUD', 1.5, 'invalid');
    expect(result.some(e => e.field === 'baseCurrency')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing exchange rate when currencies differ returns error', () => {
    const result = validateCurrency('AUD', undefined, 'USD');
    expect(result.some(e => e.field === 'exchangeRate')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('valid currency with exchange rate returns no errors', () => {
    const result = validateCurrency('AUD', 1.5, 'USD');
    expect(result).toStrictEqual([]);
  });
});

describe('validateTax', () => {
  test('valid tax returns no errors', () => {
    const result = validateTax({
      taxId: 'GST',
      countryCode: 'AU',
      taxPercentage: 10
    });
    expect(result).toStrictEqual([]);
  });

  test('null tax returns error', () => {
    const result = validateTax(null as any);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].field).toStrictEqual(expect.any(String));
    expect(result[0].message).toStrictEqual(expect.any(String));
  });

  test('missing taxId returns error', () => {
    const result = validateTax({
      taxId: '',
      countryCode: 'AU',
      taxPercentage: 10
    });
    expect(result.some(e => e.field === 'tax.taxId')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('missing countryCode returns error', () => {
    const result = validateTax({
      taxId: 'GST',
      countryCode: '',
      taxPercentage: 10
    });
    expect(result.some(e => e.field === 'tax.countryCode')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('negative taxPercentage returns error', () => {
    const result = validateTax({
      taxId: 'GST',
      countryCode: 'AU',
      taxPercentage: -1
    });
    expect(result.some(e => e.field === 'tax.taxPercentage')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('taxPercentage over 100 returns error', () => {
    const result = validateTax({
      taxId: 'GST',
      countryCode: 'AU',
      taxPercentage: 101
    });
    expect(result.some(e => e.field === 'tax.taxPercentage')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});