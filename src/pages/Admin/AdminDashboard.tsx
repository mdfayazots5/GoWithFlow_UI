import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  PlayCircle, 
  FileText, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Clock,
  Flame
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Session } from '@/types';
import { DUMMY_SESSIONS } from '@/data/dummy/session.dummy';
import { DUMMY_USERS } from '@/data/dummy/user.dummy';

export default function AdminDashboard() {
  const { isDemo, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalScripts: 0,
    totalMistakes: 0
  });
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [grammarStats, setGrammarStats] = useState<{ tag: string, count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isDemo) {
          setStats({
            totalUsers: DUMMY_USERS.length,
            activeSessions: DUMMY_SESSIONS.length,
            totalScripts: 12,
            totalMistakes: 45
          });
          setRecentSessions(DUMMY_SESSIONS);
          setGrammarStats([
            { tag: "Have Been / Has Been", count: 78 },
            { tag: "Perfect Tense Usage", count: 45 },
            { tag: "Article Confusion (a/an)", count: 32 },
            { tag: "Sentence Structure", count: 28 }
          ]);
          return;
        }

        const [usersSnap, sessionsSnap, scriptsSnap, mistakesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'sessions'), orderBy('createdDate', 'desc'), limit(10))),
          getDocs(collection(db, 'scripts')),
          getDocs(collection(db, 'mistakes'))
        ]);

        setStats({
          totalUsers: usersSnap.size,
          activeSessions: sessionsSnap.size,
          totalScripts: scriptsSnap.size,
          totalMistakes: mistakesSnap.size
        });

        setRecentSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session)));

        // Aggregate grammar tags from mistakes
        const mistakesData = mistakesSnap.docs.map(doc => doc.data());
        const tagsMap: Record<string, number> = {};
        mistakesData.forEach(m => {
          if (m.grammarTag) {
            tagsMap[m.grammarTag] = (tagsMap[m.grammarTag] || 0) + 1;
          }
        });
        
        const sortedTags = Object.entries(tagsMap)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        setGrammarStats(sortedTags);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isDemo]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gwf-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-blue-500" />} label="Total Users" value={stats.totalUsers} color="bg-blue-50" />
        <StatCard icon={<PlayCircle className="text-orange-500" />} label="Sessions Played" value={stats.activeSessions} color="bg-orange-50" />
        <StatCard icon={<FileText className="text-green-500" />} label="Scripts Uploaded" value={stats.totalScripts} color="bg-green-50" />
        <StatCard icon={<AlertCircle className="text-red-500" />} label="Mistakes Recorded" value={stats.totalMistakes} color="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black italic text-gwf-text">Recent Sync Cycles</h3>
              <Link to="/admin/reports" className="text-xs font-bold text-gwf-primary hover:underline">View All Operations</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gwf-border shadow-sm overflow-hidden">
               {/* ... table content remains same ... */}
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-gwf-bg/50 border-b border-gwf-border">
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Session</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gwf-border">
                   {recentSessions.map((session) => (
                     <tr key={session.id} className="hover:bg-gwf-bg/30 transition-colors">
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="font-bold text-sm tracking-tight">{session.sessionName}</span>
                           <span className="text-[10px] text-gwf-muted uppercase font-black tracking-tighter">{session.sessionMode}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                           session.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                         }`}>
                           {session.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => navigate(`/admin/reports`)}
                           className="p-2 hover:bg-gwf-primary/10 rounded-lg text-gwf-primary transition-colors flex items-center justify-center ml-auto"
                           title="View Report"
                         >
                           <ChevronRight size={18} className="pointer-events-none" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>

          {/* Member Engagement Leaderboard */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black italic text-gwf-text">Engagement Leaders</h3>
              <Link to="/admin/users" className="text-xs font-bold text-gwf-primary hover:underline">Manage All Members</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {DUMMY_USERS.filter(u => u.role !== 'ADMIN').sort((a,b) => b.totalPracticeHours - a.totalPracticeHours).slice(0, 4).map((user, idx) => (
                  <button 
                    key={user.id} 
                    className="bg-white p-4 rounded-2xl border border-gwf-border flex items-center justify-between hover:border-gwf-primary/20 hover:shadow-md transition-all cursor-pointer text-left w-full" 
                    onClick={() => navigate('/admin/users')}
                  >
                     <div className="flex items-center gap-3 pointer-events-none">
                        <div className="relative">
                           <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border border-gwf-border" />
                           <div className="absolute -top-1 -right-1 w-4 h-4 bg-gwf-primary text-white text-[8px] flex items-center justify-center rounded-full font-black">
                              {idx + 1}
                           </div>
                        </div>
                        <div>
                           <p className="text-sm font-bold truncate max-w-[100px]">{user.fullName}</p>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-gwf-muted flex items-center gap-0.5">
                                 <Clock size={8} /> {user.totalPracticeHours}h
                              </span>
                              <span className="text-[9px] font-black uppercase text-gwf-accent flex items-center gap-0.5">
                                 <Flame size={8} /> {user.dailyStreakCount}d
                              </span>
                           </div>
                        </div>
                     </div>
                     <TrendingUp size={16} className="text-gwf-success pointer-events-none" />
                  </button>
               ))}
            </div>
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="space-y-4">
          <h3 className="text-lg font-black italic text-gwf-text">Weak Areas (Grammar)</h3>
          <div className="bg-white p-6 rounded-2xl border border-gwf-border shadow-sm space-y-6">
            {grammarStats.length > 0 ? (
              grammarStats.map((item, idx) => (
                <WeakArea 
                  key={item.tag} 
                  row={item.tag} 
                  value={item.count} 
                  color={idx === 0 ? "bg-gwf-primary" : idx === 1 ? "bg-gwf-accent" : "bg-gwf-warning"} 
                />
              ))
            ) : (
              <p className="text-center text-gwf-muted italic text-xs py-10">No mistakes data collected yet.</p>
            )}
            
            <div className="pt-4 border-t border-gwf-border">
              <p className="text-[10px] text-gwf-muted font-black uppercase italic text-center">Across all active syncs</p>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gwf-primary p-6 rounded-3xl text-white space-y-4 shadow-xl">
            <h4 className="font-black italic">Quick Actions</h4>
            <div className="grid grid-cols-1 gap-2">
               <button 
                onClick={() => navigate('/admin/scripts/upload')}
                className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left px-4"
              >
                Upload New Script
              </button>
              <button 
                onClick={() => navigate('/admin/reports')}
                className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left px-4"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gwf-border shadow-sm flex flex-col gap-4">
      <div className={`p-3 rounded-2xl w-fit ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black italic tracking-tighter text-gwf-text">{value}</p>
        <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function WeakArea({ row, value, color }: { row: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
        <span className="text-gwf-text">{row}</span>
        <span className="text-gwf-muted">{value} users</span>
      </div>
      <div className="h-2 bg-gwf-bg rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
