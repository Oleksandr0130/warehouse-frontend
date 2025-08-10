import { useState, useEffect } from 'react';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import Register from './components/Register';
import Login from './components/Login';
import Confirmation from './components/Confirmation';
import AppContent from './components/AppContent';
import { validateTokens, logout } from './types/AuthManager';
import { toast } from 'react-toastify';
import LanguageSwitchInline  from "./components/LanguageSwitchInline.tsx";
import {applyLanguage, initTranslator} from "./types/translate.ts";

function App() {
  const [authStage, setAuthStage] = useState<'login' | 'register' | 'confirmed'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Применим язык из localStorage ещё до проверки логина
  useEffect(() => {
    const lang = localStorage.getItem('preferredLang') || 'en';
    applyLanguage(lang);
    initTranslator('gt_widget_global').catch(() => {});
  }, []);

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
          <LanguageSwitchInline compact />
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
