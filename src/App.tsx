import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import SignUp from './components/SignUp';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return showLogin ? (
      <Login onSwitchToSignUp={() => setShowLogin(false)} />
    ) : (
      <SignUp onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  return profile.role === 'superadmin' ? (
    <SuperAdminDashboard />
  ) : (
    <AdminDashboard />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
