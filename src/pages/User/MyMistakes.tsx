import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Play,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Mistake } from '@/types';
import { repracticeService } from '@/lib/repracticeService';
import { format } from 'date-fns';

export default function MyMistakes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('PENDING');

  useEffect(() => {
    if (!user) return;
    const fetchMistakes = async () => {
      try {
        const data = await repracticeService.getMistakesByUser(user.id);
        setMistakes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, [user]);

  const filteredMistakes = mistakes.filter(m => {
    const matchesSearch = m.utteranceText.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.mistakeDetail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' ? true :
                          filterType === 'PENDING' ? !m.resolved : m.resolved;
    return matchesSearch && matchesFilter;
  });

  const resolvedCount = mistakes.filter(m => m.resolved).length;
  const pendingCount = mistakes.filter(m => !m.resolved).length;
  const improvementRate = mistakes.length > 0 ? Math.round((resolvedCount / mistakes.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gwf-bg">
        <div className="w-12 h-12 border-4 border-gwf-primary/20 border-t-gwf-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-32">
       {/* Dashboard Header */}
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[40px] border border-gwf-border shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <History size={120} className="text-gwf-primary" />
          </div>
          
          <div className="space-y-2 relative z-10">
             <div className="flex items-center gap-2 text-gwf-primary mb-2">
                <div className="w-2 h-2 rounded-full bg-gwf-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Mistake Bank</span>
             </div>
             <h1 className="text-4xl font-black italic tracking-tight text-gwf-text">Refinement Lab</h1>
             <p className="text-gwf-muted text-sm font-medium">Turn your hurdles into rhythmic strengths.</p>
          </div>

          <div className="flex items-center gap-4 relative z-10">
             <div className="text-right">
                <p className="text-3xl font-black italic text-gwf-accent">{improvementRate}%</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-gwf-muted">Improvement</p>
             </div>
             <div className="w-px h-10 bg-gwf-border mx-2" />
             <div className="text-right">
                <p className="text-3xl font-black italic text-gwf-primary">{pendingCount}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-gwf-muted">Pending Syncs</p>
             </div>
          </div>
       </header>

       {/* Action Bar */}
       <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gwf-muted group-focus-within:text-gwf-primary transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Search by word or rule..."
               className="w-full bg-white border border-gwf-border h-14 pl-14 pr-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gwf-primary/20 focus:border-gwf-primary transition-all font-medium text-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-gwf-border w-full md:w-auto">
             {(['PENDING', 'RESOLVED', 'ALL'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterType === type 
                    ? 'bg-gwf-primary text-white shadow-lg shadow-gwf-primary/20' 
                    : 'text-gwf-muted hover:bg-gwf-bg hover:text-gwf-text'
                  }`}
                >
                   {type}
                </button>
             ))}
          </div>

          {pendingCount > 0 && (
             <button 
               onClick={() => navigate('/repractice')}
               className="btn-primary h-14 px-8 flex items-center gap-3 whitespace-nowrap shadow-xl shadow-gwf-primary/20 w-full md:w-auto"
             >
                Start Sync Round <Play size={18} />
             </button>
          )}
       </div>

       {/* Mistake List */}
       <div className="space-y-4">
          <AnimatePresence mode="popLayout">
             {filteredMistakes.length > 0 ? (
                filteredMistakes.map((mistake, idx) => (
                   <motion.div
                     key={mistake.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ delay: idx * 0.05 }}
                     className={`group glass p-6 rounded-[32px] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                       mistake.resolved 
                       ? 'border-gwf-success/20 bg-gwf-success/5' 
                       : 'border-gwf-border hover:border-gwf-primary/30 hover:shadow-xl hover:shadow-gwf-primary/5'
                     }`}
                   >
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                               mistake.mistakeType === 'GRAMMAR' ? 'bg-gwf-accent/10 text-gwf-accent' :
                               mistake.mistakeType === 'PRONUNCIATION' ? 'bg-gwf-secondary/10 text-gwf-secondary' :
                               'bg-gwf-primary/10 text-gwf-primary'
                            }`}>
                               {mistake.mistakeType}
                            </span>
                            <span className="text-[10px] font-bold text-gwf-muted flex items-center gap-1">
                               <TrendingUp size={10} /> {mistake.practiceCount || 1} Sync Attempts
                            </span>
                         </div>

                         <div className="space-y-1">
                            <p className="text-xs text-gwf-muted font-bold uppercase tracking-widest flex items-center gap-2">
                               <AlertCircle size={12} className="text-gwf-error" /> You mentioned:
                            </p>
                            <p className="text-lg font-black italic text-gwf-text/60 line-through decoration-gwf-error/30">
                               "{mistake.spokenText}"
                            </p>
                         </div>

                         <div className="space-y-1">
                            <p className="text-xs text-gwf-success font-bold uppercase tracking-widest flex items-center gap-2">
                               <CheckCircle2 size={12} /> Target Sync:
                            </p>
                            <p className="text-xl font-black italic text-gwf-text">
                               "{mistake.utteranceText}"
                            </p>
                         </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-gwf-border pt-4 md:pt-0 md:pl-8">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-gwf-muted uppercase tracking-widest">Last Attempt</p>
                            <p className="text-xs font-bold text-gwf-text">{format(new Date(mistake.lastAttempt), 'MMM d, h:mm a')}</p>
                         </div>

                         {mistake.resolved ? (
                            <div className="flex items-center gap-2 text-gwf-success font-black italic text-sm uppercase">
                               Resolved <CheckCircle2 size={18} />
                            </div>
                         ) : (
                            <button 
                              onClick={() => navigate('/repractice')}
                              className="text-gwf-primary font-black italic text-sm uppercase flex items-center gap-1 hover:underline underline-offset-4"
                            >
                               Practice <ArrowRight size={14} />
                            </button>
                         )}
                      </div>
                   </motion.div>
                ))
             ) : (
                <div className="py-20 text-center space-y-6 glass rounded-[40px] border border-dashed border-gwf-border">
                   <div className="w-20 h-20 bg-gwf-bg rounded-full flex items-center justify-center mx-auto text-gwf-muted">
                      <BookOpen size={40} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black italic text-gwf-text">All Syncs Clear!</h3>
                      <p className="text-gwf-muted text-sm font-medium">No pending mistakes in this category. Great job!</p>
                   </div>
                </div>
             )}
          </AnimatePresence>
       </div>
    </div>
  );
}
