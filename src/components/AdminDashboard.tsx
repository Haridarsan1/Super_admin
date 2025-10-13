import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AdminActivityLog } from '../types/database';
import { LogOut, Activity, Clock, User, Mail, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyActivityLogs();
  }, []);

  const fetchMyActivityLogs = async () => {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .eq('admin_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching activity logs:', error);
    } else {
      setActivityLogs(data || []);
    }
    setLoading(false);
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'logout': return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
      case 'action': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'password_reset': return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-slate-900/50 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-slate-400">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-7 h-7" />
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Full Name</p>
              <p className="text-white font-medium">{profile?.full_name || 'Not set'}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Email</p>
              <div className="flex items-center gap-2 text-white font-medium">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Role</p>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/50">
                {profile?.role}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Member Since</p>
              <div className="flex items-center gap-2 text-white font-medium">
                <Calendar className="w-4 h-4" />
                {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-7 h-7" />
            My Activity History
          </h2>
          {loading ? (
            <div className="text-center text-slate-400 py-12">Loading activity...</div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center text-slate-400 py-12">No activity recorded yet</div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map(log => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActivityColor(log.activity_type)}`}>
                      {log.activity_type}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-4 h-4" />
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                  <p className="text-white text-sm mb-2">{log.description}</p>
                  {log.user_agent && (
                    <p className="text-slate-500 text-xs truncate">
                      {log.user_agent}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Welcome to Your Dashboard</h3>
          <p className="text-slate-300 text-sm">
            This is your personal admin dashboard where you can view your profile information and track your activity history.
            All your actions are logged for security and audit purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
