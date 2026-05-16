import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  ArrowLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Zap,
  BarChart3,
  Calendar,
  Activity,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Session, Mistake } from '@/types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

export default function ImprovementTracker() {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [sessionsSnap, mistakesSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'sessions'), 
            where('memberIds', 'array-contains', user.id),
            where('status', '==', 'COMPLETED'),
            orderBy('createdDate', 'desc'), 
            limit(30)
          )),
          getDocs(query(
            collection(db, 'mistakes'), 
            where('userId', '==', user.id)
          ))
        ]);

        setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session)));
        setMistakes(mistakesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mistake)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Data Aggregation
  const avgFluency = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.lastEvaluation?.overallScore || 0), 0) / sessions.length) 
    : 0;

  const mistakesResolved = mistakes.filter(m => m.resolved).length;
  
  // Weekly Trend Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: format(d, 'MMM d'),
      dayName: format(d, 'EE'),
      fullDate: startOfDay(d),
      score: 0,
      count: 0,
      active: false
    };
  });

  sessions.forEach(s => {
    const date = new Date((s.createdDate as any)?.seconds * 1000 || Date.now());
    last7Days.forEach(d => {
      if (isSameDay(d.fullDate, date)) {
        d.active = true;
        if (s.lastEvaluation?.overallScore) {
          d.score += s.lastEvaluation.overallScore;
          d.count += 1;
        }
      }
    });
  });

  const trendData = last7Days.map(d => ({
    name: d.date,
    score: d.count > 0 ? Math.round(d.score / d.count) : null
  }));

  // Mistake Categories
  const mistakeTypeCounts = mistakes.reduce((acc, m) => {
    acc[m.mistakeType] = (acc[m.mistakeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(mistakeTypeCounts).map(([name, value]) => ({
    name,
    value,
    color: name === 'GRAMMAR' ? '#F27D26' : name === 'PRONUNCIATION' ? '#6366F1' : '#10B981'
  })).sort((a, b) => b.value - a.value);

  const grammarStats = Array.from(new Set(mistakes.map(m => m.grammarTag))).filter(Boolean).map(tag => {
    const tagMistakes = mistakes.filter(m => m.grammarTag === tag);
    const resolvedCount = tagMistakes.filter(m => m.resolved).length;
    const improvement = Math.round((resolvedCount / tagMistakes.length) * 100);
    return { tag, total: tagMistakes.length, resolved: resolvedCount, improvement };
  }).sort((a, b) => b.improvement - a.improvement).slice(0, 5);

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-gwf-bg text-gwf-primary font-black italic">
        Analyzing Neural Progress...
     </div>
  );

  return (
    <div className="min-h-screen bg-gwf-bg pb-32">
      <header className="p-6 bg-white border-b border-gwf-border flex items-center justify-between sticky top-0 z-20">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-gwf-bg hover:bg-gwf-primary/10 rounded-xl transition-all border border-gwf-border hover:border-gwf-primary/30 group"
          title="Go back"
        >
          <ArrowLeft size={24} className="group-active:scale-90 transition-transform" />
        </button>
        <div className="text-center">
           <h1 className="text-xl font-black italic tracking-tight">Fluency Lab</h1>
           <p className="text-[8px] font-black uppercase text-gwf-muted tracking-[0.2em]">Neural Growth Dashboard</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="p-2 bg-gwf-bg hover:bg-gwf-primary/10 rounded-xl transition-all border border-gwf-border hover:border-gwf-primary/30 group"
          title="Print Neural Report"
        >
           <Activity size={20} className="text-gwf-primary group-active:scale-90 transition-transform" />
        </button>
      </header>

      <main className="p-6 space-y-8 max-w-4xl mx-auto">
        {/* Streak Visualizer */}
        <section className="bg-white p-6 rounded-[40px] border border-gwf-border shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Flame size={120} className="text-orange-500" />
           </div>
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                 <div className="flex items-center gap-2 mb-1">
                    <Flame size={20} className="text-orange-500 fill-orange-500" />
                    <span className="text-2xl font-black italic text-gwf-text">{user?.dailyStreakCount || 0} Day Streak</span>
                 </div>
                 <p className="text-xs text-gwf-muted font-bold tracking-widest uppercase italic">You're in the elite 5% of learners today!</p>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                 {last7Days.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                       <span className={`text-[8px] font-black uppercase ${isSameDay(day.fullDate, new Date()) ? 'text-gwf-primary' : 'text-gwf-muted'}`}>
                          {day.dayName[0]}
                       </span>
                       <motion.div 
                         initial={{ scale: 0 }}
                         animate={{ scale: 1 }}
                         transition={{ delay: idx * 0.1 }}
                         className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center transition-all ${
                            day.active 
                            ? 'bg-gwf-primary text-white shadow-lg shadow-gwf-primary/20' 
                            : 'bg-gwf-bg text-gwf-muted border border-gwf-border border-dashed'
                         }`}
                       >
                          {day.active ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-gwf-border" />}
                       </motion.div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <SummaryCard 
             label="Sync Cycles" 
             value={user?.totalSessionsPlayed || 0} 
             icon={<Zap className="text-gwf-primary" />} 
             trend="+12%"
           />
           <SummaryCard 
             label="Peak Fluency" 
             value={`${avgFluency}%`} 
             icon={<TrendingUp className="text-gwf-success" />} 
             trend="Steady"
           />
           <SummaryCard 
             label="Mistakes Fixed" 
             value={mistakesResolved} 
             icon={<CheckCircle2 className="text-gwf-accent" />} 
             trend={`${Math.round((mistakesResolved / (mistakes.length || 1)) * 100)}%`}
           />
           <SummaryCard 
             label="Avg Difficulty" 
             value="B2" 
             icon={<Target className="text-gwf-secondary" />} 
             trend="Growing"
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Primary Chart */}
           <section className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-sm font-black uppercase tracking-widest text-gwf-muted italic flex items-center gap-2">
                    <BarChart3 size={16} /> Fluency Velocity (7 Days)
                 </h2>
              </div>
              <div className="card-base h-[350px] p-6 flex flex-col">
                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={trendData}>
                          <defs>
                             <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F27D26" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#6B7280' }} 
                            dy={10}
                          />
                          <YAxis 
                            hide 
                            domain={[0, 100]} 
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                              fontSize: '12px',
                              fontWeight: 900
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#F27D26" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorScore)"
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </section>

           {/* Mistake Breakdown */}
           <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-sm font-black uppercase tracking-widest text-gwf-muted italic flex items-center gap-2">
                    <AlertCircle size={16} /> Knowledge Gaps
                 </h2>
              </div>
              <div className="card-base h-[350px] p-6 flex flex-col justify-between">
                 {categoryData.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                       <Target size={40} className="mb-4" />
                       <p className="text-xs font-black italic">No mistakes found.<br/>Perfect sync.</p>
                    </div>
                 ) : (
                    <>
                       <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={categoryData} layout="vertical" margin={{ left: -20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                  dataKey="name" 
                                  type="category" 
                                  axisLine={false} 
                                  tickLine={false}
                                  tick={{ fontSize: 9, fontWeight: 900, fill: '#1F2937' }}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                   {categoryData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                   ))}
                                </Bar>
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="space-y-3 mt-4">
                          {categoryData.slice(0, 3).map(item => (
                             <div key={item.name} className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-gwf-muted">{item.name}</span>
                                <span className="text-xs font-black italic">{item.value} times</span>
                             </div>
                          ))}
                       </div>
                    </>
                 )}
              </div>
           </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Grammar Mastery & Improvement */}
           <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-sm font-black uppercase tracking-widest text-gwf-muted italic flex items-center gap-2">
                    <Award size={16} /> Learning Analytics
                 </h2>
              </div>
              <div className="card-base space-y-0 p-0 border-gwf-border overflow-hidden">
                 <div className="bg-gwf-bg/30 p-4 border-b border-gwf-border">
                    <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">Accuracy Improvement by Tag</p>
                 </div>
                 {grammarStats.length === 0 ? (
                    <p className="text-center text-gwf-muted italic text-sm py-8">No rule data recorded.</p>
                 ) : (
                    grammarStats.map((item, idx) => (
                      <div key={item.tag} className="p-5 flex items-center justify-between border-b border-gwf-border last:border-b-0 hover:bg-gwf-bg/20 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gwf-primary/5 flex items-center justify-center text-gwf-primary">
                               <Sparkles size={18} />
                            </div>
                            <div className="space-y-1">
                               <p className="text-sm font-bold italic">{item.tag}</p>
                               <div className="flex items-center gap-2">
                                  <div className="w-32 h-1.5 bg-gwf-bg rounded-full overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       whileInView={{ width: `${item.improvement}%` }}
                                       className={`h-full ${item.improvement === 100 ? 'bg-gwf-success' : 'bg-gwf-primary'}`}
                                     />
                                  </div>
                                  <span className="text-[9px] font-black italic text-gwf-primary">{item.improvement}%</span>
                                </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-black text-gwf-success mb-0.5 flex items-center justify-end gap-1">
                               <ArrowUpRight size={14} /> {item.improvement}%
                            </p>
                            <p className="text-[8px] font-bold text-gwf-muted uppercase tracking-[1px]">{item.resolved}/{item.total} Resolved</p>
                         </div>
                      </div>
                    ))
                 )}
              </div>
           </section>

           {/* Achievements */}
           <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-sm font-black uppercase tracking-widest text-gwf-muted italic flex items-center gap-2">
                    <Calendar size={16} /> Milestones
                 </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <Badge 
                   icon={<Flame />} 
                   label="7-Day Sync" 
                   active={(user?.dailyStreakCount || 0) >= 7} 
                   desc="Neural Consistency"
                 />
                 <Badge 
                   icon={<Zap />} 
                   label="High Voltage" 
                   active={avgFluency >= 90} 
                   desc="Peak Performance"
                 />
                 <Badge 
                   icon={<CheckCircle2 />} 
                   label="The Fixer" 
                   active={mistakesResolved >= 10} 
                   desc="10 Errors Avoided"
                 />
                 <Badge 
                   icon={<Award />} 
                   label="Lab Veteran" 
                   active={(user?.totalSessionsPlayed || 0) >= 20} 
                   desc="20 Sessions Logged"
                 />
              </div>
           </section>
        </div>

        {/* Recent Session Log */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-gwf-muted italic flex items-center gap-2">
                 <Clock size={16} /> Sync Logs
              </h2>
              <button 
                onClick={() => navigate('/user/sessions')} 
                className="text-[10px] font-black uppercase text-gwf-primary tracking-widest hover:underline"
              >
                 View Complete Archive
              </button>
           </div>
           <div className="card-base overflow-hidden p-0 border-gwf-border">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-gwf-bg/50 border-b border-gwf-border">
                       <tr>
                          <th className="px-6 py-4 text-[9px] font-black uppercase text-gwf-muted tracking-[1.5px]">Operation</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase text-gwf-muted tracking-[1.5px]">Accuracy</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase text-gwf-muted tracking-[1.5px]">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gwf-border">
                       {sessions.slice(0, 5).map((session) => (
                          <tr 
                            key={session.id} 
                            className="hover:bg-gwf-bg/30 transition-colors cursor-pointer"
                            onClick={() => navigate(`/user/sessions/${session.id}`)}
                          >
                             <td className="px-6 py-4">
                                <p className="font-bold text-xs italic">{session.sessionName}</p>
                                <p className="text-[8px] text-gwf-muted font-black uppercase tracking-tighter">{format(new Date((session.createdDate as any)?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</p>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                   <div className={`w-1.5 h-1.5 rounded-full ${
                                      (session.lastEvaluation?.overallScore || 0) >= 80 ? 'bg-gwf-success' : 
                                      (session.lastEvaluation?.overallScore || 0) >= 60 ? 'bg-gwf-warning' : 'bg-gwf-error'
                                   }`} />
                                   <span className="font-black italic text-xs">{session.lastEvaluation?.overallScore || 0}%</span>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gwf-muted">Verified</span>
                             </td>
                          </tr>
                       ))}
                       {sessions.length === 0 && (
                          <tr>
                             <td colSpan={3} className="px-6 py-12 text-center text-xs italic text-gwf-muted">No sync cycles recorded yet. Start your first session!</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </section>

        {/* Global CTA */}
        <div className="flex flex-col md:flex-row gap-4 pt-12">
           <button 
             onClick={() => navigate('/session/join')} 
             className="flex-1 btn-primary h-14 rounded-2xl flex items-center justify-center gap-3 italic font-black shadow-lg shadow-gwf-primary/20"
           >
              New Sync Cycle <Zap size={20} />
           </button>
           <button 
             onClick={() => navigate('/user/mistakes')} 
             className="flex-1 bg-white border border-gwf-border h-14 rounded-2xl flex items-center justify-center gap-3 italic font-black hover:bg-gwf-bg transition-all"
           >
              Polish Mistakes <RotateCcw size={20} className="text-gwf-primary" />
           </button>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon, trend }: { label: string, value: string | number, icon: React.ReactNode, trend?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="card-base flex flex-col justify-between p-5 group"
    >
       <div className="flex items-center justify-between">
          <div className="p-2.5 bg-gwf-bg rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
          {trend && (
             <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
               trend.startsWith('+') ? 'bg-gwf-success/10 text-gwf-success' : 'bg-gwf-bg text-gwf-muted'
             }`}>{trend}</span>
          )}
       </div>
       <div className="mt-4">
          <p className="text-2xl font-black italic tracking-tighter text-gwf-text">{value}</p>
          <p className="text-[9px] font-black uppercase text-gwf-muted tracking-[0.2em]">{label}</p>
       </div>
    </motion.div>
  );
}

function Badge({ icon, label, active, desc }: { icon: React.ReactNode, label: string, active: boolean, desc: string }) {
  return (
    <div className={`p-5 rounded-[32px] border transition-all flex flex-col items-center text-center gap-3 ${
      active ? 'bg-white border-gwf-primary/20 shadow-xl shadow-gwf-primary/5' : 'bg-gwf-bg/50 border-gwf-border opacity-40 grayscale'
    }`}>
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${active ? 'bg-gwf-primary text-white shadow-lg shadow-gwf-primary/20' : 'bg-gwf-bg text-gwf-muted'}`}>
          {icon}
       </div>
       <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gwf-text">{label}</p>
          <p className="text-[7px] font-bold text-gwf-muted uppercase tracking-tighter mt-0.5">{desc}</p>
       </div>
       {active && (
          <div className="w-1.5 h-1.5 rounded-full bg-gwf-primary animate-pulse" />
       )}
    </div>
  );
}
