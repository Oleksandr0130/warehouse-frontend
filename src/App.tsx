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
    toast.success('Successful Login!');
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setAuthStage('login');
    toast.info('Successful Logout!');
  };

  if (!isAuthenticated) {
    return (
        <div className="auth-container">
          {authStage === 'login' && (
              <>
                <Login onSuccess={handleAuthSuccess} />
                <p>
                  New account{' '}
                  <button onClick={() => setAuthStage('register')}>Register</button>
                </p>
              </>
          )}
          {authStage === 'register' && (
              <>
                <Register onSuccess={() => setAuthStage('login')} />
                <p>
                  Do you already have an account?{' '}
                  <button onClick={() => setAuthStage('login')}>Log in</button>
                </p>
              </>
          )}
          {authStage === 'confirmed' && <Confirmation />}
          {/* Невидимый глобальный контейнер для виджета */}
          <div id="gt_widget_global" style={{ width: 0, height: 0, overflow: 'hidden' }} />
        </div>
    );
  }

  return (
  <>
  <AppContent onLogout={handleLogout} />
  </>)
}

export default App;
