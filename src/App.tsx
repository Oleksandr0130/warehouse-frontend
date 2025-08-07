import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppContent from './components/AppContent';
import Login from './components/Login';
import Register from './components/Register';
import Confirmation from './components/Confirmation';
import { logout, validateTokens } from './types/AuthManager';
import './styles/App.css';

function App() {
  // Управление состоянием авторизации
  const [authStage, setAuthStage] = useState<'login' | 'register' | 'confirmed'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Проверяем токены при загрузке
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

  // Если пользователь не авторизован, покажем экран авторизации
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
                  Hast du schon ein Konto? <button onClick={() => setAuthStage('login')}>Einloggen</button>
                </p>
              </>
          )}
          {authStage === 'confirmed' && <Confirmation />}
        </div>
    );
  }

  // Пользователь авторизован — отображаем контент приложения
  return <AppContent onLogout={handleLogout} />;
}

export default App;