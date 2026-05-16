import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PlayCircle, 
  Plus, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Flame,
  Zap,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Session, Mistake } from '@/types';
import { format } from 'date-fns';
import { DUMMY_SESSIONS } from '@/data/dummy/session.dummy';
import { DUMMY_MISTAKES } from '@/data/dummy/mistake.dummy';

export default function UserDashboard() {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [pendingMistakes, setPendingMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      try {
        if (isDemo) {
          // Simulate loading
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const mySessions = DUMMY_SESSIONS.filter(s => s.memberIds?.includes(user.id));
          const active = mySessions.find(s => ['LOBBY', 'ACTIVE'].includes(s.status));
          const completed = mySessions
            .filter(s => s.status === 'COMPLETED')
            .sort((a, b) => (b.createdDate?.seconds || 0) - (a.createdDate?.seconds || 0))
            .slice(0, 3);
          
          const activeMistakes = DUMMY_MISTAKES
            .filter(m => m.userId === user.id && !m.resolved)
            .slice(0, 3);

          if (active) setActiveSession(active);
          setRecentSessions(completed);
          setPendingMistakes(activeMistakes);
          return;
        }

        const [activeSnap, mistakesSnap, recentSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'sessions'), 
            where('memberIds', 'array-contains', user.id),
            where('status', 'in', ['LOBBY', 'ACTIVE']), 
            limit(1)
          )),
          getDocs(query(
            collection(db, 'mistakes'), 
            where('userId', '==', user.id), 
            where('resolved', '==', false), 
            limit(3)
          )),
          getDocs(query(
            collection(db, 'sessions'), 
            where('memberIds', 'array-contains', user.id),
            where('status', '==', 'COMPLETED'), 
            orderBy('createdDate', 'desc'), 
            limit(3)
          ))
        ]);

        const activeDoc = activeSnap.docs[0];
        if (activeDoc) setActiveSession({ id: activeDoc.id, ...activeDoc.data() } as Session);
        
        setRecentSessions(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session)));
        setPendingMistakes(mistakesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mistake)));
      } catch (err) {
        console.error('Dashboard Data Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, isDemo]);

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-gwf-bg text-gwf-primary font-black italic">
        Syncing Neural Dashboard...
     </div>
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gwf-bg/50 pb-24">
      {/* Header - Phase 9: Greeting Header */}
      <header className="p-8 pb-4 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black italic text-gwf-text">Good Morning, {user?.fullName.split(' ')[0]}! 👋</h1>
          
          <div className="flex items-center gap-2 mt-2">
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gwf-accent rounded-full shadow-lg shadow-gwf-accent/20">
                <Flame size={14} className="text-white fill-white" />
                <span className="text-[11px] font-black uppercase text-white tracking-widest">{user?.dailyStreakCount || 0} Day Streak</span>
             </div>
             <p className="text-[10px] font-bold text-gwf-muted uppercase tracking-widest ml-1">{today}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/user/profile')}
          className="w-14 h-14 rounded-2xl bg-white border-2 border-white overflow-hidden shadow-md hover:scale-110 active:scale-95 transition-all ring-1 ring-gwf-border"
        >
           <img src={user?.avatar} alt="Profile" className="w-full h-full object-cover" />
        </button>
      </header>

      <main className="px-6 space-y-6 max-w-2xl mx-auto">
        {/* Phase 9: Active Session Banner */}
        {activeSession && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gwf-primary p-5 rounded-[32px] text-white flex items-center justify-between shadow-xl shadow-gwf-primary/20 relative overflow-hidden"
          >
             <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
             <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                   <Zap size={24} className="fill-white" />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1">Active Session</p>
                   <p className="font-black italic text-base leading-tight">{activeSession.sessionName}</p>
                </div>
             </div>
             <button 
               onClick={() => navigate(activeSession.status === 'LOBBY' ? `/session/lobby/${activeSession.id}` : `/live-session/${activeSession.id}`)}
               className="bg-white text-gwf-primary px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all relative z-10 shadow-sm"
             >
               Rejoin
             </button>
          </motion.div>
        )}

        {/* Phase 9: Pending Correction Rounds Banner */}
        {pendingMistakes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gwf-accent/30 p-5 rounded-[32px] text-gwf-text flex items-center justify-between shadow-sm relative overflow-hidden"
          >
             <div className="absolute left-0 top-0 w-1 h-full bg-gwf-accent" />
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gwf-accent/10 rounded-2xl flex items-center justify-center text-gwf-accent">
                   <AlertCircle size={24} />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gwf-accent leading-none mb-1">Repractice Waiting</p>
                   <p className="font-black italic text-base text-gwf-text leading-tight">{pendingMistakes.length} correction rounds pending</p>
                </div>
             </div>
             <button 
               onClick={() => navigate('/user/mistakes')}
               className="bg-gwf-accent text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gwf-accent/20"
             >
               Practice Now
             </button>
          </motion.div>
        )}

        {/* Phase 9: Quick Actions Grid (2x2) */}
        <section className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <ActionCard 
                icon={<PlayCircle size={32} />} 
                label="Join Session" 
                onClick={() => navigate('/session/join')} 
                bgColor="bg-white"
                iconColor="text-gwf-primary"
              />
              <ActionCard 
                icon={<FileText size={32} />} 
                label="Library" 
                onClick={() => navigate('/scripts')} 
                bgColor="bg-white"
                iconColor="text-gwf-accent"
              />
              <ActionCard 
                icon={<TrendingUp size={32} />} 
                label="Progress" 
                onClick={() => navigate('/user/progress')} 
                bgColor="bg-white"
                iconColor="text-gwf-success"
              />
              <ActionCard 
                icon={<AlertCircle size={32} />} 
                label="Mistakes" 
                onClick={() => navigate('/user/mistakes')} 
                bgColor="bg-white"
                iconColor="text-gwf-error"
              />
           </div>
        </section>

        {/* Phase 9: Recent Sessions (Vertical Stack - No Scroll) */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black uppercase text-gwf-muted tracking-[0.1em] italic">Session Activity</h2>
              <Link to="/user/sessions" className="text-[10px] font-black uppercase text-gwf-primary tracking-widest hover:underline flex items-center gap-1">
                 Analytics <ChevronRight size={12} />
              </Link>
           </div>
           <div className="space-y-4">
              {recentSessions.map((session) => (
                <button 
                  key={session.id} 
                  onClick={() => navigate(`/user/sessions/${session.id}`)}
                  className="w-full bg-white p-6 rounded-[32px] border border-gwf-border space-y-4 text-left hover:border-gwf-primary/30 transition-all group shadow-sm active:scale-[0.98] relative overflow-hidden"
                >
                   <div className="absolute right-0 top-0 w-24 h-24 bg-gwf-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500" />
                   
                   <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gwf-primary/5 rounded-full text-[9px] font-black uppercase text-gwf-primary border border-gwf-primary/10">{session.sessionMode}</span>
                      </div>
                      <div className="bg-gwf-success/10 px-3 py-1 rounded-full flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-gwf-success animate-pulse" />
                         <span className="text-[11px] font-black italic text-gwf-success">{session.lastEvaluation?.overallScore || 0}% Accuracy</span>
                      </div>
                   </div>
                   <div className="space-y-1 relative z-10">
                      <h3 className="font-black italic text-gwf-text group-hover:text-gwf-primary transition-colors text-xl leading-none">{session.sessionName}</h3>
                      <p className="text-[11px] text-gwf-muted font-bold uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12} className="opacity-40" />
                        {session.scriptTitle}
                      </p>
                   </div>
                   <div className="flex items-center justify-between pt-2 border-t border-gwf-bg">
                      <p className="text-[9px] font-black italic text-gwf-muted uppercase tracking-tighter">
                        {session.createdDate 
                          ? format(
                              session.createdDate.seconds 
                                ? new Date(session.createdDate.seconds * 1000) 
                                : new Date(session.createdDate), 
                              'MMM d, yyyy'
                            )
                          : 'Recent'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gwf-error bg-gwf-error/5 px-2 py-0.5 rounded">
                         <AlertCircle size={12} />
                         {session.lastEvaluation?.grammarErrors?.length || 0} Mistakes
                      </div>
                   </div>
                </button>
              ))}
              {recentSessions.length === 0 && (
                <div className="w-full text-center py-20 border-2 border-dashed border-gwf-border rounded-[40px] bg-white/30 backdrop-blur-sm">
                   <div className="w-16 h-16 bg-gwf-bg rounded-3xl flex items-center justify-center mx-auto mb-4 opacity-50">
                      <PlayCircle size={32} className="text-gwf-muted" />
                   </div>
                   <p className="text-gwf-muted italic text-sm font-black">Voice Engine Standing By</p>
                   <p className="text-[10px] font-bold text-gwf-muted/60 uppercase tracking-[0.2em] mt-1 mb-6">No sessions detected in registry</p>
                   <button 
                    onClick={() => navigate('/session/join')} 
                    className="bg-gwf-primary text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gwf-primary/20"
                   >
                    Join Your First Session
                   </button>
                </div>
              )}
           </div>
        </section>

        {/* Phase 9: My Pending Mistakes (Top 3) */}
        {pendingMistakes.length > 0 && (
          <section className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-[11px] font-black uppercase text-gwf-muted tracking-[0.1em] italic">Pending Mistakes</h2>
                <Link to="/user/mistakes" className="text-[10px] font-black uppercase text-gwf-primary tracking-widest hover:underline">View All</Link>
             </div>
             <div className="space-y-2">
                {pendingMistakes.map((mistake) => (
                  <div key={mistake.id} className="bg-white p-5 rounded-[28px] border border-gwf-border flex items-center justify-between hover:border-gwf-primary/20 transition-all group">
                     <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 bg-gwf-bg rounded-2xl flex items-center justify-center text-gwf-primary shrink-0 group-hover:bg-gwf-primary/10 transition-colors">
                           <Zap size={22} />
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-2 mb-0.5">
                              <span className="px-2 py-0.5 bg-gwf-bg text-gwf-muted rounded text-[8px] font-black uppercase tracking-widest">{mistake.mistakeType}</span>
                              <span className="text-[9px] font-bold text-gwf-muted italic">{mistake.grammarTag}</span>
                           </div>
                           <p className="font-bold text-sm text-gwf-text truncate italic leading-none">"{mistake.utteranceText}"</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => navigate(`/repractice/${mistake.id}`)} 
                       className="bg-gwf-primary text-white p-2.5 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-md shadow-gwf-primary/10"
                       title="Practice Now"
                     >
                        <ChevronRight size={20} />
                     </button>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Phase 9: Motivational Footer */}
        <footer className="py-16 px-6 text-center space-y-4">
           <div className="w-12 h-12 bg-gwf-bg rounded-full flex items-center justify-center mx-auto mb-2">
              <Sparkles size={24} className="text-gwf-primary" />
           </div>
           <div>
              <p className="text-[11px] font-black uppercase text-gwf-primary tracking-[0.3em] mb-2 scale-y-90">Motivational Tip</p>
              <p className="max-w-[280px] mx-auto text-sm font-bold italic text-gwf-text leading-relaxed">
                "💡 Tip: Speak without stopping. Pausing reduces your fluency score."
              </p>
           </div>
           <p className="text-[9px] font-bold text-gwf-muted tracking-widest uppercase opacity-40">LingoSync — Final Stable v2.0</p>
        </footer>
      </main>
    </div>
  );
}

function ActionCard({ icon, label, onClick, bgColor, iconColor }: { icon: React.ReactNode, label: string, onClick: () => void, bgColor: string, iconColor: string }) {
  return (
    <button 
      onClick={onClick}
      className={`${bgColor} p-6 rounded-[32px] border border-gwf-border flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-sm group`}
    >
      <div className={`${iconColor} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gwf-muted group-hover:text-gwf-primary transition-colors">{label}</span>
    </button>
  );
}
