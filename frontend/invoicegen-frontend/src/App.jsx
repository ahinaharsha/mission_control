import { useState } from 'react';
import Auth from './pages/Auth';
import Homepage from './pages/Homepage';
import InvoiceForm from './pages/InvoiceForm';
import Retrieve from './pages/Retrieval';

function App() {
  const [page, setPage] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  function handleLogin(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setPage('app');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setPage('home');
  }

  function handleNavigate(destination) {
    setPage(destination);
  }

  if (token) return <InvoiceForm token={token} onLogout={handleLogout} />;
  if (page === 'login' || page === 'register') return <Auth onLogin={handleLogin} initialTab={page} onNavigate={handleNavigate} />;
  if (page === 'retrieve') return <Retrieve onNavigate={handleNavigate} />;
  return <Homepage onNavigate={handleNavigate} />;
}

export default App;