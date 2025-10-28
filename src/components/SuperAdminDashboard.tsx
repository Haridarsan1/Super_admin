import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Profile, ActivityLogWithProfile } from '../types/database';
import { LogOut, Users, Activity, Clock, Mail, Shield, Calendar } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
    fetchActivityLogs();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'superadmin'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching admins (profiles):', err);
    }
  };

  const fetchActivityLogs = async () => {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select(`
        *,
        profile:profiles(*)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching activity logs:', error);
    } else {
      setActivityLogs(data || []);
    }
    setLoading(false);
  };

  // Fetch projects for an admin (graceful if 'projects' table doesn't exist)
  const fetchProjectsForAdmin = async (adminId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch projects for admin (table may not exist or RLS denies access):', error.message || error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Failed to fetch projects for admin:', err);
      return [];
    }
  };

  // High-level handler for showing admin details (fetches projects and selects admin)
  const showAdminDetails = async (adminId: string) => {
    setLoading(true);
    try {
      const projects = await fetchProjectsForAdmin(adminId as string);
      console.debug('Projects for admin', adminId, projects);
      // For now we just set the selected admin to filter activity; UI can be extended to open a modal
      setSelectedAdmin(adminId);
    } catch (err) {
      console.error('Error showing admin details:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = selectedAdmin
    ? activityLogs.filter(log => log.admin_id === selectedAdmin)
    : activityLogs;

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
              <Shield className="w-8 h-8 text-amber-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Super Admin Dashboard</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Admins</p>
                <p className="text-3xl font-bold text-white mt-1">{admins.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Super Admins</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {admins.filter(a => a.role === 'superadmin').length}
                </p>
              </div>
              <Shield className="w-12 h-12 text-amber-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Activities</p>
                <p className="text-3xl font-bold text-white mt-1">{activityLogs.length}</p>
              </div>
              <Activity className="w-12 h-12 text-green-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Admin Users
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              <button
                onClick={() => setSelectedAdmin(null)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedAdmin === null
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <p className="text-white font-medium">All Admins</p>
                <p className="text-slate-400 text-sm">View all activity</p>
              </button>
              {admins.map(admin => (
                <button
                  key={admin.id}
                  onClick={() => showAdminDetails(admin.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedAdmin === admin.id
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{admin.full_name || 'No name'}</p>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      admin.role === 'superadmin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                    }`}>
                      {admin.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Mail className="w-4 h-4" />
                    {admin.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(admin.created_at)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Activity Logs
              {selectedAdmin && (
                <span className="text-sm font-normal text-slate-400">
                  (Filtered)
                </span>
              )}
            </h2>
            {loading ? (
              <div className="text-center text-slate-400 py-8">Loading...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No activity logs found</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActivityColor(log.activity_type)}`}>
                        {log.activity_type}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                    <p className="text-white text-sm mb-2">{log.description}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Mail className="w-3 h-3" />
                      {log.profile?.email || 'Unknown user'}
                    </div>
                    {log.user_agent && (
                      <p className="text-slate-500 text-xs mt-1 truncate">
                        {log.user_agent}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
