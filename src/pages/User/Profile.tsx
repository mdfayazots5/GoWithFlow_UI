import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  AlertCircle,
  Camera,
  ChevronRight,
  Globe,
  Bell,
  Smartphone,
  Calendar,
  X,
  Target
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { userService } from '@/lib/userService';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna'
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    ageGroup: '',
    hintLanguage: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user as User);
      setFormData({
        fullName: user.fullName || '',
        ageGroup: user.ageGroup || 'Adult (18+)',
        hintLanguage: user.preferredHintLanguage || 'Telugu',
        avatar: user.avatar || AVATARS[0]
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await userService.updateProfile(user.id, {
        fullName: formData.fullName,
        ageGroup: formData.ageGroup as any,
        preferredHintLanguage: formData.hintLanguage,
        avatar: formData.avatar
      });
      setIsEditing(false);
      window.location.reload(); // Refresh to update auth context
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gwf-bg pb-24">
      <header className="p-6 bg-white border-b border-gwf-border sticky top-0 z-10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gwf-bg rounded-xl transition-all">
               <ChevronRight size={20} className="rotate-180 text-gwf-muted" />
            </button>
            <h1 className="text-xl font-black italic tracking-tight">Sync Identity</h1>
         </div>
         <button onClick={() => navigate('/user/notifications')} className="p-2 hover:bg-gwf-bg rounded-xl transition-all">
            <Bell size={20} className="text-gwf-muted" />
         </button>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-6 text-center">
           <div className="relative">
              <div className="w-24 h-24 rounded-[32px] border-4 border-gwf-primary/20 p-1 bg-white shadow-xl">
                 <img src={formData.avatar} className="w-full h-full object-cover rounded-[24px]" alt="Avatar" />
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-2 -right-2 p-2 bg-gwf-primary text-white rounded-xl shadow-lg shadow-gwf-primary/30 active:scale-95 transition-all"
              >
                 <Camera size={16} />
              </button>
           </div>
           
           <div className="space-y-1">
              <h2 className="text-2xl font-black italic">{profile.fullName}</h2>
              <p className="text-xs text-gwf-muted font-bold tracking-widest uppercase">{profile.email}</p>
           </div>

           <div className="flex gap-2">
              <span className="px-3 py-1 bg-gwf-primary/10 text-gwf-primary text-[9px] font-black uppercase rounded-lg border border-gwf-primary/20">
                 {profile.ageGroup}
              </span>
              <span className="px-3 py-1 bg-gwf-accent/10 text-gwf-accent text-[9px] font-black uppercase rounded-lg border border-gwf-accent/20">
                 {profile.preferredHintLanguage} Sync
              </span>
              <div className="px-3 py-1 bg-gwf-secondary/10 text-gwf-secondary text-[9px] font-black uppercase rounded-lg border border-gwf-secondary/20 flex items-center gap-1">
                 <Flame size={10} /> 7 Day Streak
              </div>
           </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base space-y-6"
          >
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black italic uppercase text-gwf-muted">Edit Sync Profile</h3>
                <button onClick={() => setIsEditing(false)}><X size={18} className="text-gwf-muted" /></button>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gwf-muted">Choose Avatar</label>
                   <div className="flex gap-4">
                      {AVATARS.map((av) => (
                        <button 
                          key={av} 
                          onClick={() => setFormData(prev => ({ ...prev, avatar: av }))}
                          className={`w-12 h-12 rounded-xl border-2 transition-all ${formData.avatar === av ? 'border-gwf-primary p-0.5' : 'border-transparent opacity-40'}`}
                        >
                           <img src={av} className="w-full h-full object-cover rounded-lg" />
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gwf-muted">Full Name</label>
                   <input 
                      type="text"
                      className="gwf-input"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gwf-muted">Sync Hint Language</label>
                      <select 
                        className="gwf-input"
                        value={formData.hintLanguage}
                        onChange={(e) => setFormData(prev => ({ ...prev, hintLanguage: e.target.value }))}
                      >
                         <option>Telugu</option>
                         <option>Hindi</option>
                         <option>Kannada</option>
                         <option>Tamil</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gwf-muted">Age Group</label>
                      <select 
                        className="gwf-input"
                        value={formData.ageGroup}
                        onChange={(e) => setFormData(prev => ({ ...prev, ageGroup: e.target.value }))}
                      >
                         <option>Under 18</option>
                         <option>18-24</option>
                         <option>25-34</option>
                         <option>35+</option>
                      </select>
                   </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary w-full h-12 rounded-2xl flex items-center justify-center gap-2"
                >
                   {saving ? 'Syncing...' : 'Save Profile Changes'} <CheckCircle2 size={18} />
                </button>
             </div>
          </motion.div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
           <AccountStat label="Total Syncs" value={14} icon={<Target size={14} />} />
           <AccountStat label="Avg Fluency" value="82%" icon={<TrendingUp size={14} />} />
           <AccountStat label="Mistakes Refined" value={54} icon={<AlertCircle size={14} />} />
           <AccountStat label="Member Since" value="May 2024" icon={<Calendar size={14} />} />
        </div>

        {/* Settings Links */}
        <div className="space-y-3">
           <p className="text-[10px] font-black uppercase tracking-widest text-gwf-muted px-2">Learning Progress</p>
           <div className="bg-white border border-gwf-border rounded-[32px] overflow-hidden mb-4">
              <SettingsLink 
                icon={<TrendingUp size={18} />} 
                label="Fluency Analytics" 
                onClick={() => navigate('/user/progress')}
              />
              <SettingsLink 
                icon={<AlertCircle size={18} />} 
                label="Mistake Bank" 
                onClick={() => navigate('/user/mistakes')}
              />
              <SettingsLink 
                icon={<Target size={18} />} 
                label="My Learning Syncs" 
                onClick={() => navigate('/user/sessions')}
              />
           </div>

           <p className="text-[10px] font-black uppercase tracking-widest text-gwf-muted px-2">Account Settings</p>
           <div className="bg-white border border-gwf-border rounded-[32px] overflow-hidden">
              <SettingsLink icon={<Bell size={18} />} label="Notifications" onClick={() => navigate('/user/notifications')} />
              <SettingsLink icon={<Globe size={18} />} label="App Language" value="English" />
              <SettingsLink icon={<Smartphone size={18} />} label="Mobile Number" value="+91 98*** **456" />
           </div>
        </div>

        <button 
           onClick={() => logout()}
           className="w-full h-14 rounded-2xl border-2 border-gwf-error/20 text-gwf-error font-black italic text-lg flex items-center justify-center gap-2 hover:bg-gwf-error/5 transition-all"
        >
           <LogOut size={20} /> Logout
        </button>
      </main>
    </div>
  );
}

function AccountStat({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="card-base py-5 flex flex-col gap-2">
       <div className="flex items-center gap-2 text-gwf-muted">
          {icon}
          <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <p className="text-xl font-black italic">{value}</p>
    </div>
  );
}

function SettingsLink({ icon, label, value, onClick }: { icon: React.ReactNode, label: string, value?: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-5 flex items-center justify-between border-b border-gwf-border last:border-b-0 hover:bg-gwf-bg transition-all"
    >
       <div className="flex items-center gap-4">
          <div className="text-gwf-primary opacity-60">{icon}</div>
          <span className="text-sm font-bold">{label}</span>
       </div>
       <div className="flex items-center gap-2">
          {value && <span className="text-xs text-gwf-muted font-medium">{value}</span>}
          <ChevronRight size={14} className="text-gwf-muted" />
       </div>
    </button>
  );
}
