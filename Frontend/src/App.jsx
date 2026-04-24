import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import RoomBooking from './components/RoomBooking';
import AdminSettings from './components/AdminSettings';
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [receiptSettings, setReceiptSettings] = useState({ hotelName: '', hotelAddress: '' });

  useEffect(() => {
      fetchReceiptSettings();
  }, []);

  const fetchReceiptSettings = async () => {
        try {
            const nameRes = await axios.get('http://127.0.0.1:4455/api/settings/hotel_name');
            const addrRes = await axios.get('http://127.0.0.1:4455/api/settings/hotel_address');
        if (nameRes.data.success) {
            setReceiptSettings({
                hotelName: nameRes.data.value || '',
                hotelAddress: addrRes.data.value || ''
            });
        }
    } catch (err) {
        console.error('Failed to fetch receipt settings', err);
    }
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <nav className="bg-white shadow-sm p-4 sticky top-0 z-40">
          <div className="container mx-auto flex justify-between items-center">
            <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="10" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 10V8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 18v2h14v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="hidden sm:inline tracking-tight">RoomBookingApp</span>
            </div>
            <div className="flex gap-1 items-center">
              {isAuthenticated && user && (
                <span className="text-gray-600 font-medium mr-2">
                  {user.username}
                </span>
              )}
              <button 
                onClick={() => changeLanguage('th')}
                className={`px-2 py-1 rounded text-xs sm:text-sm font-medium transition ${i18n.language === 'th' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                TH
              </button>
              <button 
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded text-xs sm:text-sm font-medium transition ${i18n.language === 'en' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                EN
              </button>
              {isAuthenticated && user?.role === 'admin' && (
                <button 
                    onClick={() => setShowSettings(true)}
                    className="ml-1 px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                    title="Settings"
                >
                    ⚙️
                </button>
              )}
              {isAuthenticated ? (
                <button onClick={handleLogout} className="ml-2 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap text-red-500 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition">
                  {i18n.t('logout')}
                </button>
              ) : (
                <Link to="/login" className="ml-2 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap text-blue-500 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                  {i18n.t('login')}
                </Link>
              )}
            </div>
          </div>
        </nav>

        <div className="py-6">
          <Routes>
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={<RoomBooking user={user} receiptSettings={receiptSettings} />} 
            />
          </Routes>
        </div>

        {showSettings && <AdminSettings onClose={() => setShowSettings(false)} onSaveSuccess={fetchReceiptSettings} />}
      </div>
    </Router>
  );
}

export default App;
