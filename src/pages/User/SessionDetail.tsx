import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Timer, 
  Target, 
  Zap, 
  TrendingUp, 
  MessageSquare, 
  CheckCircle2, 
  RotateCcw,
  BookOpen,
  Volume2,
  Users,
  Star,
  Activity,
  Calendar
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session, Mistake, Script } from '@/types';
import { format } from 'date-fns';

import { useAuth } from '@/lib/AuthContext';
import { DUMMY_SESSIONS } from '@/data/dummy/session.dummy';
import { DUMMY_SCRIPTS } from '@/data/dummy/script.dummy';
import { DUMMY_MISTAKES } from '@/data/dummy/mistake.dummy';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        if (isDemo) {
          const sData = DUMMY_SESSIONS.find(s => s.id === id);
          if (sData) {
            setSession(sData);
            if (sData.scriptId) {
              const scrData = DUMMY_SCRIPTS.find(sc => sc.id === sData.scriptId);
              if (scrData) setScript(scrData);
            }
            const mData = DUMMY_MISTAKES.filter(m => m.sessionId === id);
            setMistakes(mData);
          }
          setLoading(false);
          return;
        }

        const sSnap = await getDoc(doc(db, 'sessions', id));
        if (sSnap.exists()) {
          const sData = { id: sSnap.id, ...sSnap.data() } as Session;
          setSession(sData);

          if (sData.scriptId) {
            const scrSnap = await getDoc(doc(db, 'scripts', sData.scriptId));
            if (scrSnap.exists()) {
              setScript({ id: scrSnap.id, ...scrSnap.data() } as Script);
            }
          }

          const mQuery = query(collection(db, 'mistakes'), where('sessionId', '==', id));
          const mSnap = await getDocs(mQuery);
          setMistakes(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Mistake)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return (
     <div className="min-h-screen bg-gwf-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gwf-primary" />
     </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-gwf-bg flex flex-col items-center justify-center p-6 text-center">
       <Activity size={48} className="text-gwf-muted opacity-20 mb-4" />
       <h2 className="text-xl font-black italic">Session Not Found</h2>
       <button onClick={() => navigate(-1)} className="mt-4 text-gwf-primary font-bold">Go Back</button>
    </div>
  );

  const fluencyColor = (session.lastEvaluation?.overallScore || 0) >= 80 ? 'text-gwf-success' : (session.lastEvaluation?.overallScore || 0) >= 60 ? 'text-gwf-warning' : 'text-gwf-error';
  const bgFluency = (session.lastEvaluation?.overallScore || 0) >= 80 ? 'bg-gwf-success/10 border-gwf-success/20' : (session.lastEvaluation?.overallScore || 0) >= 60 ? 'bg-gwf-warning/10 border-gwf-warning/20' : 'bg-gwf-error/10 border-gwf-error/20';

  return (
    <div className="min-h-screen bg-gwf-bg pb-24">
      <header className="p-6 bg-white border-b border-gwf-border sticky top-0 z-10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gwf-bg rounded-xl transition-all">
               <ChevronLeft size={20} className="text-gwf-muted" />
            </button>
            <h1 className="text-xl font-black italic tracking-tight">Sync Analysis</h1>
         </div>
         <div className="px-3 py-1 bg-gwf-primary/10 text-gwf-primary text-[9px] font-black uppercase rounded-lg border border-gwf-primary/20">
            {session.sessionMode}
         </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-10">
        {/* Basic Info */}
        <div className="space-y-2">
           <p className="text-[10px] font-black uppercase tracking-widest text-gwf-muted italic">Performance Summary</p>
           <h2 className="text-2xl font-black italic">{session.sessionName}</h2>
           <div className="flex flex-wrap gap-4 text-[10px] text-gwf-muted font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} /> 
                {session.createdDate 
                  ? format(
                      session.createdDate.seconds 
                        ? new Date(session.createdDate.seconds * 1000) 
                        : new Date(session.createdDate), 
                      'MMM d, yyyy'
                    )
                  : 'Recent'}
              </span>
              <span className="flex items-center gap-1.5"><Timer size={12} /> 12 Minutes</span>
              <span className="flex items-center gap-1.5"><Users size={12} /> {session.maxMembers} Members</span>
           </div>
        </div>

        {/* Score Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className={`card-base p-6 text-center space-y-2 ${bgFluency}`}>
              <p className={`text-4xl font-black italic tracking-tighter ${fluencyColor}`}>{session.lastEvaluation?.overallScore || 0}%</p>
              <p className="text-[9px] font-black uppercase text-gwf-muted tracking-widest">Fluency Sync</p>
           </div>
           <ScoreCard icon={<Zap size={14} className="text-gwf-accent" />} label="Confidence" value={`${session.lastEvaluation?.confidenceScore || 0}%`} />
           <ScoreCard icon={<TrendingUp size={14} className="text-gwf-primary" />} label="Speed" value={`${session.lastEvaluation?.speakingSpeedWPM || 0} wpm`} />
           <ScoreCard icon={<MessageSquare size={14} className="text-gwf-warning" />} label="Mistakes" value={mistakes.length} />
        </div>

        {/* Mistakes Section */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black italic uppercase text-gwf-muted">My Session Challenges</h3>
              <span className="text-[10px] font-bold text-gwf-error bg-gwf-error/5 px-2 py-0.5 rounded border border-gwf-error/10">{mistakes.length} Red Fixes</span>
           </div>
           
           <div className="grid gap-3">
              {mistakes.map((m) => (
                <div key={m.id} className="glass p-5 rounded-[28px] border border-gwf-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${m.mistakeType === 'GRAMMAR' ? 'bg-gwf-primary/10 text-gwf-primary' : 'bg-gwf-accent/10 text-gwf-accent'}`}>
                             {m.mistakeType}
                          </span>
                          {m.grammarTag && <span className="text-[8px] font-bold text-gwf-muted italic">{m.grammarTag}</span>}
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-xs text-gwf-error line-through opacity-40 italic">"{m.spokenText}"</p>
                          <p className="text-sm font-bold italic text-gwf-text">"{m.utteranceText}"</p>
                       </div>
                   </div>
                   <button 
                     onClick={() => navigate('/repractice/new')}
                     className="px-5 py-2 bg-gwf-primary/5 text-gwf-primary text-[10px] font-black uppercase rounded-full border border-gwf-primary/10 hover:bg-gwf-primary hover:text-white transition-all whitespace-nowrap"
                   >
                      Refine Sync
                   </button>
                </div>
              ))}
              {mistakes.length === 0 && (
                <div className="card-base py-12 text-center space-y-2 border-dashed">
                   <CheckCircle2 size={32} className="mx-auto text-gwf-success opacity-20" />
                   <p className="text-sm font-bold italic text-gwf-muted">Pure Sync Perfection. No mistakes recorded.</p>
                </div>
              )}
           </div>
        </section>

        {/* Feedback Section */}
        <section className="grid md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h3 className="text-sm font-black italic uppercase text-gwf-muted">Listener Feedbacks</h3>
              <div className="bg-white rounded-[32px] border border-gwf-border p-6 shadow-sm divide-y divide-gwf-border/50">
                 <FeedbackRow label="Perfect Sync" count={8} icon={<CheckCircle2 size={16} className="text-gwf-success" />} />
                 <FeedbackRow label="Minor Hesitation" count={2} icon={<Target size={16} className="text-gwf-warning" />} />
                 <FeedbackRow label="Unclear Tone" count={1} icon={<Volume2 size={16} className="text-gwf-primary" />} />
                 <FeedbackRow label="Accuracy Miss" count={1} icon={<AlertCircle size={16} className="text-gwf-error" />} />
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-sm font-black italic uppercase text-gwf-muted">Partner Scores</h3>
              <div className="bg-white rounded-[32px] border border-gwf-border overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-gwf-bg border-b border-gwf-border">
                       <tr>
                          <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-gwf-muted">Member</th>
                          <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-gwf-muted">Fluency</th>
                          <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-gwf-muted">Mistakes</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gwf-border">
                       <PartnerRow name="Aarav" score="88%" mistakes={2} />
                       <PartnerRow name="Ishani" score="91%" mistakes={1} />
                       <PartnerRow name="Rahul" score="75%" mistakes={4} />
                    </tbody>
                 </table>
              </div>
           </div>
        </section>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <button 
             onClick={() => navigate('/repractice/new')}
             className="w-full h-16 btn-primary rounded-3xl flex items-center justify-center gap-3 italic font-black text-lg shadow-xl shadow-gwf-primary/30"
           >
              Start Correction Round <RotateCcw size={22} />
           </button>
           <button 
             onClick={() => navigate('/')}
             className="w-full h-16 bg-white border-2 border-gwf-border rounded-3xl flex items-center justify-center gap-3 italic font-black text-lg hover:bg-gwf-bg transition-all"
           >
              Back to Dashboard
           </button>
        </div>

      </main>
    </div>
  );
}

function ScoreCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="card-base p-6 text-center space-y-2">
       <div className="flex justify-center">{icon}</div>
       <p className="text-2xl font-black italic tracking-tighter">{value}</p>
       <p className="text-[9px] font-black uppercase text-gwf-muted tracking-widest">{label}</p>
    </div>
  );
}

function FeedbackRow({ label, count, icon }: { label: string, count: number, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
       <div className="flex items-center gap-3">
          {icon}
          <span className="text-xs font-bold italic">{label}</span>
       </div>
       <span className="px-2 py-0.5 bg-gwf-bg rounded text-[10px] font-black text-gwf-primary">{count}</span>
    </div>
  );
}

function PartnerRow({ name, score, mistakes }: { name: string, score: string, mistakes: number }) {
  return (
    <tr>
       <td className="px-6 py-4">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-lg bg-gwf-bg border border-gwf-border overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} className="w-full h-full" alt={name} />
             </div>
             <span className="text-xs font-bold">{name}</span>
          </div>
       </td>
       <td className="px-6 py-4 text-xs font-black italic">{score}</td>
       <td className={`px-6 py-4 text-xs font-black ${mistakes > 2 ? 'text-gwf-error' : 'text-gwf-success'}`}>{mistakes}</td>
    </tr>
  );
}

function AlertCircle({ size, className }: { size: number, className: string }) {
  return <Volume2 size={size} className={className} />;
}
