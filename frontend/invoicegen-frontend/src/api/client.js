const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function register(email, password) {
  const res = await fetch(`${BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function logout(token) {
  const res = await fetch(`${BASE_URL}/v1/auth/logout`, {
    method: 'POST',
    headers: { token },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Logout failed');
  return data;
}

export async function createInvoice(xml, token) {
  const res = await fetch(`${BASE_URL}/v1/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      token,
    },
    body: xml,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
  return data;
}