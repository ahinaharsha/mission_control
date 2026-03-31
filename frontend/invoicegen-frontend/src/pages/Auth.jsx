import { useState } from 'react';
import { login, register } from '../api/client';

export default function Auth({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'register') {
        await register(email, password);
        setTab('login');
        setError('');
        alert('Registered! Please log in.');
      } else {
        const data = await login(email, password);
        onLogin(data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>🧾 Invoice Generator</h1>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'login' ? styles.tabActive : {}) }}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'register' ? styles.tabActive : {}) }}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            placeholder="you@example.com"
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f4f8',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '2rem',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontSize: '1.6rem',
    color: '#1a202c',
  },
  tabs: {
    display: 'flex',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #e2e8f0',
  },
  tab: {
    flex: 1,
    padding: '0.6rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#718096',
    fontWeight: 500,
  },
  tabActive: {
    color: '#4f46e5',
    borderBottom: '2px solid #4f46e5',
    marginBottom: -2,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#4a5568',
    marginTop: '0.5rem',
  },
  input: {
    padding: '0.6rem 0.8rem',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: '1rem',
    outline: 'none',
  },
  btn: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    color: '#e53e3e',
    fontSize: '0.875rem',
    margin: 0,
  },
};
