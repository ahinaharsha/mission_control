import { useState } from 'react';
import Auth from './pages/Auth';
import InvoiceForm from './pages/InvoiceForm';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  function handleLogin(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return <InvoiceForm token={token} onLogout={handleLogout} />;
}

export default App;
