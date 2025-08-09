import { useState, useEffect } from 'react';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import Register from './components/Register';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import AppContent from './components/AppContent';
import { validateTokens, logout } from './types/AuthManager';
import { toast } from 'react-toastify';

function App() {
  const [authStage, setAuthStage] = useState<'login' | 'register' | 'confirmed'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const isValid = await validateTokens();
      if (isValid) {
        setIsAuthenticated(true);
        setAuthStage('confirmed');
      } else {
        setIsAuthenticated(false);
      }
    };
    initializeAuth();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setAuthStage('confirmed');
    toast.success('Вы успешно вошли в систему!');
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setAuthStage('login');
    toast.info('Вы вышли из системы.');
  };

  if (!isAuthenticated) {
    return (
        <div className="auth-container">
          {authStage === 'login' && (
              <>
                <Login onSuccess={handleAuthSuccess} />
                <p>
                  Neues Konto{' '}
                  <button onClick={() => setAuthStage('register')}>Registrieren</button>
                </p>
              </>
          )}
          {authStage === 'register' && (
              <>
                <Register onSuccess={() => setAuthStage('login')} />
                <p>
                  Hast du schon ein Konto?{' '}
                  <button onClick={() => setAuthStage('login')}>Einloggen</button>
                </p>
              </>
          )}
          {authStage === 'confirmed' && <Confirmation />}
        </div>
    );
  }

  return (
  <>
  <AppContent onLogout={handleLogout} />
  </>)
}

export default App;
