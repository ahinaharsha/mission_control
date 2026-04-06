import { useState } from 'react';
import Auth from './pages/Auth';
import Homepage from './pages/Homepage';
import InvoiceForm from './pages/InvoiceForm';
import Retrieve from './pages/Retrieval';
import Profile from './pages/Profile';
import UpdateInvoice from './pages/UpdateInvoice';

function App() {
  const [page, setPage] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  function handleLogin(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setPage('home');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setPage('home');
  }

  function handleNavigate(destination) {
    setPage(destination);
  }

  if (page === 'profile') return <Profile onNavigate={handleNavigate} onLogout={handleLogout} token={token} />;
  if (page === 'home') return <Homepage onNavigate={handleNavigate} token={token} onLogout={handleLogout} />;
  if (page === 'retrieve') return <Retrieve onNavigate={handleNavigate} token={token} onLogout={handleLogout} />;
  if (page === 'update') return <UpdateInvoice token={token} onLogout={handleLogout} onNavigate={handleNavigate} />;
  if (page === 'app' && token) return <InvoiceForm token={token} onLogout={handleLogout} onNavigate={handleNavigate} />;
  if (page === 'login' || page === 'register') return <Auth onLogin={handleLogin} initialTab={page} onNavigate={handleNavigate} />;
  return <Homepage onNavigate={handleNavigate} token={token} onLogout={handleLogout} />;
}

export default App;
