import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegistering && password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      const payload = isRegistering 
        ? { username, password } 
        : { username, password };

      const response = await axios.post(`http://127.0.0.1:4455${endpoint}`, payload);

      if (response.data.success) {
        if (isRegistering) {
          setSuccessMsg(t('registrationSuccess'));
          setIsRegistering(false);
          setPassword('');
          setConfirmPassword('');
        } else {
          onLogin(response.data.token, response.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t('error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center flex-shrink-0">
          <h2 className="text-3xl font-bold text-white">
            {isRegistering ? t('register') : t('login')}
          </h2>
          <p className="text-blue-100 mt-2">
            {isRegistering ? t('createAccount') : t('welcomeBack')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-500 p-3 rounded-md text-sm text-center">
              {successMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('username')}</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 transform hover:scale-[1.02]"
          >
            {isRegistering ? t('register') : t('signIn')}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccessMsg('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {isRegistering 
                ? t('haveAccount') 
                : t('noAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
