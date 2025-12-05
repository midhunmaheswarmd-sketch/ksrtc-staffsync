import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { GlobalLoader } from './components/GlobalLoader';
import { UserRole } from './types';

interface SessionUser {
  role: UserRole;
  unitCode: string; // 'ALL' if admin
}

function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing session
    const savedSession = localStorage.getItem('ksrtc_session_v2');
    if (savedSession) {
      try {
        setIsLoading(true);
        // Simulate quick verify
        setTimeout(() => {
            setUser(JSON.parse(savedSession));
            setIsLoading(false);
        }, 500);
      } catch (e) {
        localStorage.removeItem('ksrtc_session_v2');
        setIsLoading(false);
      }
    }
  }, []);

  const handleLogin = (role: UserRole, unitCode: string) => {
    setIsLoading(true);
    // Fake network delay handled in Login component actually, but we can wrap here too
    const newUser = { role, unitCode };
    setUser(newUser);
    localStorage.setItem('ksrtc_session_v2', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
        setUser(null);
        localStorage.removeItem('ksrtc_session_v2');
        setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <GlobalLoader isLoading={isLoading} message="Processing..." />
      
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            setGlobalLoading={setIsLoading}
        />
      )}
    </div>
  );
}

export default App;