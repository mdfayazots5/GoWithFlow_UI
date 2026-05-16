import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  UserX, 
  TrendingUp,
  X,
  Phone,
  Calendar,
  Award,
  Clock,
  Flame,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DUMMY_USERS } from '@/data/dummy/user.dummy';
import { User } from '@/types';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const filteredUsers = DUMMY_USERS.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.mobileNumber.includes(searchTerm);
    const matchesAge = ageFilter === 'All' || user.ageGroup === ageFilter;
    return matchesSearch && matchesAge;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gwf-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gwf-muted" size={18} />
          <input 
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gwf-bg border border-gwf-border rounded-[16px] py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-gwf-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative min-w-[160px]">
             <select 
               value={ageFilter}
               onChange={(e) => setAgeFilter(e.target.value)}
               className="w-full bg-gwf-bg border border-gwf-border rounded-[16px] py-3 px-4 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-gwf-primary"
             >
               <option value="All">All Age Groups</option>
               <option value="Child (6-12)">Child (6-12)</option>
               <option value="Teen (13-17)">Teen (13-17)</option>
               <option value="Adult (18+)">Adult (18+)</option>
             </select>
             <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gwf-muted pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[24px] border border-gwf-border shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gwf-bg/50 border-b border-gwf-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-[0.2em]">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-[0.2em]">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-[0.2em]">Age Group</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-[0.2em]">Practice Stats</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-[0.2em]">Growth</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gwf-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gwf-bg/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-gwf-border overflow-hidden bg-gwf-bg">
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gwf-text">{user.fullName}</span>
                        <span className="text-[10px] font-black text-gwf-primary uppercase tracking-tight">{user.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gwf-muted">+91 {user.mobileNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-tight px-2 py-1 bg-gwf-bg rounded-lg border border-gwf-border">
                      {user.ageGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gwf-primary" />
                          <span className="text-xs font-black text-gwf-text italic">{user.totalPracticeHours}h</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-gwf-muted">Practice</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Flame size={12} className="text-gwf-accent" />
                          <span className="text-xs font-black text-gwf-accent italic">{user.dailyStreakCount}d</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-gwf-muted">Streak</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gwf-success">
                       <ArrowUpRight size={14} />
                       <span className="text-[10px] font-black tracking-tighter">Rising</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                      user.active ? 'bg-green-100 text-green-700' : 'bg-gwf-muted/10 text-gwf-muted'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => setSelectedUser(user)}
                         className="p-2 hover:bg-gwf-primary/10 rounded-lg text-gwf-primary transition-colors"
                         title="View Profile"
                       >
                         <Eye size={18} className="pointer-events-none" />
                       </button>
                       <button 
                         onClick={() => navigate(`/admin/reports/user/${user.id}`)}
                         className="p-2 hover:bg-gwf-accent/10 rounded-lg text-gwf-accent transition-colors"
                         title="View Full Report"
                       >
                         <TrendingUp size={18} className="pointer-events-none" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-gwf-muted italic font-medium">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* User Detail Side Panel */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[60] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gwf-border flex items-center justify-between bg-gwf-bg/50">
                <h3 className="font-black italic text-gwf-text tracking-tight uppercase">User Profile Detail</h3>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gwf-error/10 hover:text-gwf-error rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-32 h-32 rounded-full border-4 border-gwf-primary shadow-xl overflow-hidden p-1 bg-white">
                    <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black italic text-gwf-text">{selectedUser.fullName}</h4>
                    <p className="text-sm font-bold text-gwf-muted italic uppercase tracking-widest">{selectedUser.role} member</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card-base p-4 bg-gwf-bg border-none">
                    <Phone className="text-gwf-primary mb-2" size={18} />
                    <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">Mobile</p>
                    <p className="text-sm font-bold text-gwf-text">+91 {selectedUser.mobileNumber}</p>
                  </div>
                  <div className="card-base p-4 bg-gwf-bg border-none">
                    <Calendar className="text-gwf-accent mb-2" size={18} />
                    <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">Joined</p>
                    <p className="text-sm font-bold text-gwf-text">{new Date(selectedUser.registrationDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-black uppercase text-gwf-muted tracking-[0.2em]">Learning Stats</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gwf-primary/5 rounded-2xl">
                       <Clock className="text-gwf-primary" size={24} />
                       <div>
                          <p className="text-xl font-black italic text-gwf-primary">{selectedUser.totalPracticeHours}h</p>
                          <p className="text-[10px] font-black uppercase text-gwf-muted">Practice</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
                      <PlayCircle className="text-blue-500" size={24} />
                      <div>
                        <p className="text-xl font-black italic text-blue-500">{selectedUser.totalSessionsPlayed}</p>
                        <p className="text-[10px] font-black uppercase text-gwf-muted">Sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gwf-accent/5 rounded-2xl col-span-2">
                      <Flame className="text-gwf-accent" size={24} />
                      <div>
                        <p className="text-xl font-black italic text-gwf-accent">{selectedUser.dailyStreakCount} Days</p>
                        <p className="text-[10px] font-black uppercase text-gwf-muted">Learning Momentum Streak</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-black uppercase text-gwf-muted tracking-[0.2em]">Preferences</h5>
                  <div className="card-base p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gwf-muted italic">Hint Language</span>
                      <span className="text-sm font-black text-gwf-primary uppercase">{selectedUser.preferredHintLanguage}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gwf-muted font-bold italic">Age Group</span>
                      <span className="font-black text-gwf-text uppercase">{selectedUser.ageGroup}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/admin/reports/user/${selectedUser.id}`)}
                  className="w-full btn-primary h-[56px] text-lg italic shadow-xl"
                >
                  View Performance Report
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 py-4 text-gwf-error font-black uppercase text-xs hover:bg-gwf-error/5 rounded-xl transition-all">
                  <UserX size={18} /> Deactivate Account
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayCircle({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}
