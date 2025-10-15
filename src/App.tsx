// src/App.tsx
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import SignUp from './components/SignUp';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import ResetPasswordPage from './pages/reset-password';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/reset-password') {
      // Do not set page state for reset path
    } else if (path === '/signup') {
      setPage('signup');
    } else {
      setPage('login');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const path = window.location.pathname;
  if (path === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (!user || !profile) {
    return page === 'login' ? (
      <Login onSwitchToSignUp={() => setPage('signup')} />
    ) : (
      <SignUp onSwitchToLogin={() => setPage('login')} />
    );
  }

  return profile.role === 'superadmin' ? <SuperAdminDashboard /> : <AdminDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;