import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Users,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Script } from '@/types';
import { DUMMY_SCRIPTS } from '@/data/dummy/script.dummy';

export default function ScriptLibrary() {
  const navigate = useNavigate();
  const { isDemo, user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        if (isDemo) {
          setScripts(DUMMY_SCRIPTS);
          setLoading(false);
          return;
        }
        const snap = await getDocs(query(collection(db, 'scripts'), orderBy('uploadedDate', 'desc')));
        setScripts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Script)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScripts();
  }, []);

  const [selectedScriptForPreview, setSelectedScriptForPreview] = useState<Script | null>(null);

  const categories = ['All', 'Grammar Drill', 'Interview', 'Roleplay', 'Business', 'Travel'];
  const filtered = scripts.filter(s => 
    (category === 'All' || s.category === category) &&
    (s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 p-6 pb-32">
       <div className="space-y-4">
          <div className="relative">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gwf-muted pointer-events-none" />
             <input 
                type="text" 
                placeholder="Search synchronizable scripts..."
                className="gwf-input pl-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
             {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                    category === cat ? 'bg-gwf-primary text-white border-gwf-primary' : 'bg-white text-gwf-muted border-gwf-border'
                  }`}
                >
                  {cat}
                </button>
             ))}
          </div>
       </div>

       {loading ? (
         <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-t-2 border-gwf-primary rounded-full" />
         </div>
       ) : (
         <div className="grid gap-4">
            {filtered.map((script) => (
              <button 
                key={script.id}
                onClick={() => setSelectedScriptForPreview(script)}
                className="card-base text-left group hover:border-gwf-primary transition-all flex items-center justify-between gap-4"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gwf-primary/5 rounded-2xl flex items-center justify-center text-gwf-primary group-hover:bg-gwf-primary group-hover:text-white transition-all">
                       <BookOpen size={24} className="pointer-events-none" />
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gwf-bg rounded text-[8px] font-black uppercase text-gwf-muted">{script.category}</span>
                          <span className="flex items-center gap-1 text-[8px] font-bold text-gwf-muted uppercase tracking-wider">
                             <Clock size={10} className="pointer-events-none" /> {script.estDuration}m
                          </span>
                       </div>
                       <h3 className="font-black italic text-gwf-text group-hover:text-gwf-primary transition-colors">{script.title}</h3>
                       <p className="text-[10px] text-gwf-muted line-clamp-1">{script.description}</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gwf-bg overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${script.id}${i}`} />
                         </div>
                       ))}
                    </div>
                    <span className="text-[8px] font-black italic text-gwf-primary uppercase tracking-widest flex items-center gap-1">
                       Preview <ChevronRight size={10} className="pointer-events-none" />
                    </span>
                 </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20 opacity-40">
                 <Search size={48} className="mx-auto mb-4" />
                 <p className="font-black italic">No scripts found</p>
              </div>
            )}
         </div>
       )}

       {/* Script Detail Preview Modal */}
       {selectedScriptForPreview && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-gwf-text/40 backdrop-blur-sm">
             <div className="w-full max-w-lg bg-gwf-bg rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                <div className="p-8 space-y-6">
                   <div className="flex items-start justify-between">
                      <div className="space-y-1">
                         <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-gwf-primary/10 text-gwf-primary rounded-full text-[10px] font-black uppercase tracking-widest">{selectedScriptForPreview.category}</span>
                            <span className="text-[10px] font-bold text-gwf-muted uppercase tracking-widest flex items-center gap-1">
                               <TrendingUp size={12} /> Level {selectedScriptForPreview.complexityLevel}
                            </span>
                         </div>
                         <h2 className="text-3xl font-black italic text-gwf-text leading-tight">{selectedScriptForPreview.title}</h2>
                         <p className="text-sm text-gwf-muted font-medium">{selectedScriptForPreview.description}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedScriptForPreview(null)}
                        className="p-2 bg-gwf-bg border border-gwf-border rounded-full hover:bg-white transition-colors"
                      >
                         <ChevronRight size={20} className="rotate-90" />
                      </button>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-3xl border border-gwf-border flex items-center gap-4">
                         <div className="w-10 h-10 bg-gwf-primary/5 rounded-xl flex items-center justify-center text-gwf-primary">
                            <Clock size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-gwf-muted uppercase tracking-widest leading-none mb-1">Duration</p>
                            <p className="text-sm font-black italic">{selectedScriptForPreview.estDuration} Minutes</p>
                         </div>
                      </div>
                      <div className="p-4 bg-white rounded-3xl border border-gwf-border flex items-center gap-4">
                         <div className="w-10 h-10 bg-gwf-primary/5 rounded-xl flex items-center justify-center text-gwf-primary">
                            <Users size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-gwf-muted uppercase tracking-widest leading-none mb-1">Capacity</p>
                            <p className="text-sm font-black italic">Up to 5 Users</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-gwf-muted tracking-[0.2em] ml-2">Utterance Samples</p>
                      <div className="space-y-2 bg-white/50 p-2 rounded-[32px] border border-gwf-border/50">
                         {selectedScriptForPreview.utterances.slice(0, 3).map((u, i) => (
                           <div key={i} className="p-4 bg-white rounded-2xl border border-gwf-border flex gap-4 items-start shadow-sm">
                              <span className="shrink-0 w-8 h-8 rounded-full bg-gwf-bg flex items-center justify-center text-[10px] font-black italic text-gwf-muted">P{i+1}</span>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-gwf-primary uppercase tracking-tighter">{u.speakerLabel}</p>
                                 <p className="text-xs font-bold leading-relaxed">{u.englishText}</p>
                                 {u.hintText && <p className="text-[10px] text-gwf-muted italic">{u.hintText}</p>}
                              </div>
                           </div>
                         ))}
                         <div className="py-2 text-center">
                            <p className="text-[10px] font-bold text-gwf-muted uppercase tracking-widest">+ {selectedScriptForPreview.utterances.length - 3} more utterances</p>
                         </div>
                      </div>
                   </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setSelectedScriptForPreview(null)}
                        className="flex-1 px-8 py-5 bg-white border border-gwf-border rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gwf-bg transition-all text-center"
                      >
                         Close
                      </button>
                      {auth.currentUser && user?.role === 'ADMIN' && (
                        <button 
                          onClick={() => {
                            if (selectedScriptForPreview) {
                              navigate('/admin/sessions/create', { state: { scriptId: selectedScriptForPreview.id } });
                            }
                          }}
                          className="flex-[2] px-8 py-5 bg-gwf-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gwf-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                           Initialize Session <Play size={14} className="fill-white" />
                        </button>
                      )}
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
