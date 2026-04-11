import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import LandingPage from './pages/LandingPage';
import InputPage from './pages/InputPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  const screen = useStore((s) => s.screen);
  const checkDateReset = useStore((s) => s.checkDateReset);

  useEffect(() => {
    checkDateReset();
  }, [checkDateReset]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {screen === 'landing' && <LandingPage />}
      {screen === 'input' && <InputPage />}
      {screen === 'dashboard' && <DashboardPage />}
    </div>
  );
}

export default App;
