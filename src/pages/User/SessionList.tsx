import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Calendar, 
  TrendingUp, 
  ChevronRight, 
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/types';
import { useAuth } from '@/lib/AuthContext';

export default function SessionList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'sessions'),
          orderBy('createdDate', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-6 space-y-8">
       <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h2 className="text-2xl font-black italic">Sync History</h2>
             <p className="text-xs text-gwf-muted font-bold tracking-widest uppercase italic">Your past communication syncs</p>
          </div>
          <div className="w-12 h-12 bg-gwf-primary/10 rounded-2xl flex items-center justify-center text-gwf-primary">
             <History size={24} />
          </div>
       </div>

       {loading ? (
         <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-t-2 border-gwf-primary rounded-full" />
         </div>
       ) : (
         <div className="grid gap-4">
            {sessions.map((session) => (
              <button 
                key={session.id}
                onClick={() => navigate(`/user/sessions/${session.id}`)}
                className="card-base text-left hover:border-gwf-primary transition-all space-y-4 group"
              >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-gwf-bg rounded text-[8px] font-black uppercase text-gwf-muted">{session.sessionMode}</span>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${session.status === 'COMPLETED' ? 'bg-gwf-success/10 text-gwf-success' : 'bg-gwf-warning/10 text-gwf-warning'}`}>
                          {session.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-bold text-gwf-muted">
                       <Calendar size={10} />
                       {new Date(session.createdDate?.seconds * 1000 || Date.now()).toLocaleDateString()}
                    </div>
                 </div>

                 <div className="space-y-1">
                    <h3 className="font-black italic text-lg group-hover:text-gwf-primary transition-colors">{session.sessionName}</h3>
                    <p className="text-xs text-gwf-muted font-bold font-display uppercase tracking-widest">{session.scriptTitle}</p>
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-gwf-border/50">
                    <div className="flex gap-4">
                       <SessionStat icon={<TrendingUp size={12} />} label="Fluency" value={`${session.lastEvaluation?.overallScore || 0}%`} color="text-gwf-primary" />
                       <SessionStat icon={<Zap size={12} />} label="Confidence" value={`${session.lastEvaluation?.confidenceScore || 0}%`} color="text-gwf-accent" />
                    </div>
                    <ChevronRight size={16} className="text-gwf-muted group-hover:translate-x-1 transition-transform" />
                 </div>
              </button>
            ))}
            {sessions.length === 0 && (
              <div className="card-base py-12 text-center border-dashed opacity-50">
                 <Activity size={48} className="mx-auto mb-4 text-gwf-muted" />
                 <p className="font-black italic">No sessions recorded yet.</p>
                 <button 
                   onClick={() => navigate('/session/join')}
                   className="mt-4 text-gwf-primary font-bold text-xs uppercase tracking-widest hover:underline"
                 >
                   Start your first sync
                 </button>
              </div>
            )}
         </div>
       )}
    </div>
  );
}

function SessionStat({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="flex items-center gap-1.5 leading-none">
       <span className={color}>{icon}</span>
       <div className="flex flex-col">
          <span className={`text-[10px] font-black italic ${color}`}>{value}</span>
          <span className="text-[7px] font-bold text-gwf-muted uppercase tracking-[0.2em]">{label}</span>
       </div>
    </div>
  );
}
