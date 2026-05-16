import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target, 
  Star, 
  Users, 
  ArrowRight,
  RotateCcw,
  Volume2,
  Trophy,
  Activity,
  History,
  LayoutDashboard,
  Download
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Session, Assessment, Member } from '@/types';
import { DUMMY_SESSIONS } from '@/data/dummy/session.dummy';

export default function SessionReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isDemo } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      try {
        if (isDemo) {
          const sData = DUMMY_SESSIONS.find(s => s.id === id);
          if (sData) {
            setSession(sData);
          }
          setLoading(false);
          return;
        }

        const sSnap = await getDoc(doc(db, 'sessions', id));
        if (sSnap.exists()) {
          setSession({ id: sSnap.id, ...sSnap.data() } as Session);

          // Fetch members from subcollection
          const mSnap = await getDocs(collection(db, 'sessions', id, 'members'));
          setMembers(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));

          // Fetch assessments for the session
          const aQuery = query(collection(db, 'assessments'), where('sessionId', '==', id));
          const aSnap = await getDocs(aQuery);
          setAssessments(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Assessment)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) return (
     <div className="min-h-screen bg-gwf-bg flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-gwf-primary rounded-full"></div>
     </div>
  );

  if (!session && !loading) {
     return (
        <div className="min-h-screen bg-gwf-bg flex flex-col items-center justify-center p-6 text-center">
           <Activity size={48} className="text-gwf-muted opacity-20 mb-4" />
           <h2 className="text-xl font-black italic">Report Not Found</h2>
           <button onClick={() => navigate(-1)} className="mt-4 text-gwf-primary font-bold">Go Back</button>
        </div>
     );
  }

  if (!session) return null;

  // Calculate stats for current user
  const myAssessments = assessments.filter(a => a.candidateMemberId === user?.id);
  const avgFluency = myAssessments.length > 0 
    ? Math.round(myAssessments.reduce((acc, a) => acc + (a.ratings?.fluency || 0), 0) / myAssessments.length) * 20
    : 75; // Default for demo if no assessments yet

  // Best performer logic (simulated for demo if needed)
  const memberScores = members.length > 0 ? members.map(m => {
    const memberAssessments = assessments.filter(a => a.candidateMemberId === m.userId);
    const score = memberAssessments.length > 0 
      ? Math.round(memberAssessments.reduce((acc, a) => acc + (a.ratings?.fluency || 0), 0) / memberAssessments.length) * 20
      : Math.round(70 + Math.random() * 20);
    return { ...m, avgScore: score };
  }) : [
     { id: '1', name: user?.fullName || 'You', userId: user?.id, avgScore: avgFluency, avatar: user?.avatar },
     { id: '2', name: 'Aarav', userId: 'u2', avgScore: 88, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav' },
     { id: '3', name: 'Ishani', userId: 'u3', avgScore: 92, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishani' }
  ];

  const bestPerformer = [...memberScores].sort((a, b) => b.avgScore - a.avgScore)[0];

  return (
    <div className="min-h-screen bg-gwf-bg selection:bg-gwf-primary/20 pb-24">
      <main className="max-w-3xl mx-auto p-6 md:p-12 space-y-12">
        
        {/* Celebration Header */}
        <section className="text-center space-y-6 pt-8">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-24 h-24 bg-gwf-success/20 rounded-[40px] flex items-center justify-center text-gwf-success mx-auto shadow-[0_0_50px_rgba(34,197,94,0.15)]"
           >
              <Trophy size={48} />
           </motion.div>
           
           <div className="space-y-2">
              <h1 className="text-4xl font-black italic tracking-tight text-gwf-text">Session Complete! ✓</h1>
              <div className="flex items-center justify-center gap-2 text-gwf-muted font-bold text-[10px] uppercase tracking-widest italic">
                 <span>{session.sessionName}</span>
                 <span className="w-1 h-1 bg-gwf-border rounded-full" />
                 <span>12 Minutes Sync</span>
              </div>
           </div>

           <div className="flex justify-center print:hidden">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gwf-primary bg-gwf-primary/5 px-4 py-2 rounded-xl border border-gwf-primary/10 hover:bg-gwf-primary/10 transition-all"
              >
                <Download size={14} /> Export PDF Report
              </button>
           </div>
        </section>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <ReportStat label="Avg Fluency" value={`${avgFluency}%`} color="text-gwf-primary" icon={<TrendingUp size={14} />} />
           <ReportStat label="Turns Sync'd" value={myAssessments.length || 10} color="text-gwf-text" icon={<History size={14} />} />
           <ReportStat label="Mistakes" value={5} color="text-gwf-error" icon={<Activity size={14} />} />
           <ReportStat label="Group Growth" value="+12%" color="text-gwf-accent" icon={<Star size={14} />} />
        </div>

        {/* Members Leaderboard */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black italic uppercase text-gwf-muted px-1">Sync Leaderboard</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gwf-muted italic">
                 <Users size={12} /> {memberScores.length} Members Participated
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-gwf-border overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-gwf-bg/50 border-b border-gwf-border">
                    <tr>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gwf-muted">Member</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gwf-muted">Fluency</th>
                       <th className="px-6 py-4 text-[9px) font-black uppercase tracking-widest text-gwf-muted text-right">Rating</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gwf-border">
                    {memberScores.map((m) => (
                      <tr key={m.userId} className={`${m.userId === bestPerformer?.userId ? 'bg-gwf-secondary/5' : ''} transition-colors`}>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-xl bg-white border border-gwf-border p-0.5 overflow-hidden shadow-sm">
                                  <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="w-full h-full object-cover rounded-lg" alt={m.name} />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-xs font-black italic">{m.name} {m.userId === user?.id && <span className="text-[8px] font-medium text-gwf-primary opacity-60">(You)</span>}</span>
                                  {m.userId === bestPerformer?.userId && <span className="text-[8px] font-black uppercase text-gwf-secondary flex items-center gap-1"><Trophy size={8} /> MVP</span>}
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`text-sm font-black italic ${m.avgScore >= 80 ? 'text-gwf-success' : m.avgScore >= 60 ? 'text-gwf-warning' : 'text-gwf-error'}`}>
                               {m.avgScore}%
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                               {Array.from({ length: 5 }).map((_, i) => (
                                 <Star key={i} size={10} className={i < Math.floor(m.avgScore / 20) ? 'fill-gwf-warning text-gwf-warning' : 'text-gwf-border'} />
                               ))}
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>

        {/* Improvement Insight */}
        <section className="bg-gwf-primary/5 rounded-[40px] border border-gwf-primary/10 p-8 flex flex-col md:flex-row items-center gap-8 shadow-inner">
           <div className="w-16 h-16 bg-gwf-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-gwf-primary/20">
              <TrendingUp size={32} />
           </div>
           <div className="flex-1 space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black italic">Rhythm Synchronized!</h3>
              <p className="text-sm font-medium italic text-gwf-muted">Your group improved collective fluency by <span className="text-gwf-primary font-bold">12%</span> compared to previous sessions on this script.</p>
           </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
           <button 
             onClick={() => navigate('/repractice/new')}
             className="w-full h-16 btn-primary rounded-3xl glow-primary flex items-center justify-center gap-3 italic font-black text-xl shadow-2xl"
           >
              Refine Your Mistakes <RotateCcw size={22} />
           </button>
           
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate(`/user/sessions/${id}`)}
                className="h-14 bg-white border-2 border-gwf-border rounded-[28px] flex items-center justify-center gap-2 font-black italic text-sm hover:border-gwf-primary/30 transition-all shadow-sm"
              >
                 Detailed Report <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => navigate('/')}
                className="h-14 bg-white border-2 border-gwf-border rounded-[28px] flex items-center justify-center gap-2 font-black italic text-sm hover:border-gwf-primary/30 transition-all shadow-sm"
              >
                 Back to Dashboard <LayoutDashboard size={18} />
              </button>
           </div>
        </div>

      </main>
    </div>
  );
}

function ReportStat({ label, value, color, icon }: { label: string, value: string | number, color: string, icon: React.ReactNode }) {
  return (
    <div className="card-base flex flex-col gap-2 py-6 text-center hover:scale-105 transition-transform cursor-default">
       <div className="flex justify-center text-gwf-muted opacity-40">{icon}</div>
       <p className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</p>
       <p className="text-[9px] font-black uppercase text-gwf-muted tracking-widest">{label}</p>
    </div>
  );
}
