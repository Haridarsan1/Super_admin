export interface Profile {
  id: string;
  email: string;
  role: 'superadmin' | 'admin';
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  activity_type: 'login' | 'logout' | 'action' | 'password_reset';
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface ActivityLogWithProfile extends AdminActivityLog {
  profile: Profile;
}
