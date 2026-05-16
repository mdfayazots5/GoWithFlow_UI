import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  Users, 
  Clock, 
  FileSpreadsheet, 
  Cpu,
  ChevronRight,
  Send,
  CheckCircle2,
  Library
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { Session, Script } from '@/types';
import { generateScript } from '@/lib/geminiScriptService';

const MODES = [
  { id: 'SM01', name: 'Story Roleplay', desc: 'Narrative-driven character practice' },
  { id: 'SM02', name: 'Echo/Drill', desc: 'Listen and repeat with focus' },
  { id: 'SM03', name: 'Grammar Drill', desc: 'Target specific structure challenges' },
  { id: 'SM04', name: 'Mock Interview', desc: 'Professional Q&A simulation' },
];

const GRAMMAR_TAGS = ['Have Been', 'Should Be', 'Would Have', 'Must Be', 'Can Be', 'Perfect Tense', 'Simple Past'];

export default function CreateSession() {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(location.state?.script || null);

  const [formData, setFormData] = useState({
    name: location.state?.script?.title || '',
    mode: location.state?.script?.category === 'Interview' ? 'SM04' : 'SM01',
    maxMembers: location.state?.script?.utterances?.length > 0 ? Math.min(5, Math.max(2, new Set(location.state.script.utterances.map((u: any) => u.speakerLabel)).size)) : 4,
    duration: location.state?.script?.estDuration || 30,
    scriptSource: (location.state?.scriptId || location.state?.script) ? 'Library' : 'AI-Generated' as 'AI-Generated' | 'Excel' | 'Library',
    roomExpiry: 2,
    aiPrompt: 'Daily house chores and helping each other',
    grammarFocus: 'Have Been',
    context: 'Home',
    scriptId: location.state?.scriptId || location.state?.script?.id || '',
  });

  useEffect(() => {
    if (formData.scriptId && formData.scriptSource === 'Library' && !selectedScript) {
      const fetchScript = async () => {
        try {
          const sDoc = await getDoc(doc(db, 'scripts', formData.scriptId));
          if (sDoc.exists()) {
            const data = sDoc.data() as Script;
            setSelectedScript({ id: sDoc.id, ...data });
            setFormData(prev => ({
              ...prev,
              name: prev.name || data.title,
              maxMembers: data.utterances.length > 0 ? Math.min(5, Math.max(2, new Set(data.utterances.map(u => u.speakerLabel)).size)) : 2
            }));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchScript();
    }
  }, [formData.scriptId, formData.scriptSource]);

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Resolve Script ID
      let finalScriptId = formData.scriptId;

      if (formData.scriptSource === 'AI-Generated') {
        const utterances = await generateScript({
          topic: formData.aiPrompt,
          grammarTag: formData.grammarFocus,
          numMembers: formData.maxMembers,
          numLines: 20,
          context: formData.context
        });
        
        const scriptRef = await addDoc(collection(db, 'scripts'), {
          title: formData.name || `Practice: ${formData.grammarFocus}`,
          description: formData.aiPrompt,
          category: formData.mode === 'SM04' ? 'Interview' : 'Grammar Drill',
          grammarFocusTag: formData.grammarFocus,
          contextTag: formData.context,
          complexityLevel: 3,
          utterances,
          uploadedDate: new Date().toISOString(),
          estDuration: Math.ceil(utterances.length * 0.5),
          utteranceCount: utterances.length,
          active: true,
          version: 1,
          targetAgeGroup: 'All'
        });
        finalScriptId = scriptRef.id;
      }

      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const sessionData = {
        sessionName: formData.name || `${user.fullName}'s Session`,
        joinCode,
        sessionMode: MODES.find(m => m.id === formData.mode)?.name || 'Story Mode',
        maxMembers: formData.maxMembers,
        sessionDuration: formData.duration,
        hostId: user.id,
        memberIds: [user.id],
        scriptSource: formData.scriptSource,
        status: 'LOBBY',
        createdDate: serverTimestamp(),
        roomExpiry: formData.roomExpiry,
        scriptId: finalScriptId,
      };

      const docRef = await addDoc(collection(db, 'sessions'), sessionData);

      // Add Host as first member
      await addDoc(collection(db, 'sessions', docRef.id, 'members'), {
        userId: user.id,
        name: user.fullName,
        avatar: user.avatar,
        slot: 1,
        role: 'Host',
        ready: true,
        joinedAt: new Date().toISOString(),
      });

      navigate(`/session/lobby/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gwf-bg pb-24">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-gwf-bg/80 backdrop-blur-md z-20 transition-all">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black font-display uppercase tracking-widest">Create Room</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 space-y-8 max-w-2xl mx-auto">
        {error && (
          <div className="p-4 bg-gwf-accent/10 border border-gwf-accent/30 rounded-2xl text-gwf-accent text-xs font-bold flex items-center gap-3">
             <div className="p-2 bg-gwf-accent/10 rounded-lg">⚠️</div>
             {error}
          </div>
        )}
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gwf-muted uppercase tracking-widest ml-1">Session Name</label>
            <input 
              type="text" 
              placeholder="e.g., Weekend Family Chat"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gwf-card/50 border border-gwf-border rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gwf-primary outline-none transition-all placeholder:text-gwf-muted/50 text-lg font-bold"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gwf-muted uppercase tracking-widest ml-1">Practice Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setFormData({...formData, mode: mode.id})}
                  className={`p-6 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${
                    formData.mode === mode.id 
                    ? 'bg-gwf-primary/10 border-gwf-primary shadow-2xl glow-primary' 
                    : 'bg-gwf-card/20 border-gwf-border/50 hover:border-gwf-primary/30'
                  }`}
                >
                  {formData.mode === mode.id && (
                     <div className="absolute top-0 right-0 w-16 h-16 bg-gwf-primary/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
                  )}
                  <div className="flex items-center justify-between mb-3">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${formData.mode === mode.id ? 'text-gwf-primary' : 'text-gwf-muted'}`}>
                        {mode.id}
                     </span>
                     {formData.mode === mode.id && <CheckCircle2 size={16} className="text-gwf-primary" />}
                  </div>
                  <h4 className={`text-lg font-black italic mb-1 transition-colors ${formData.mode === mode.id ? 'text-gwf-text' : 'text-gwf-muted'}`}>
                     {mode.name}
                  </h4>
                  <p className="text-xs text-gwf-muted/80 leading-relaxed font-medium">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gwf-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <Users size={14} /> Max Members
              </label>
              <div className="flex items-center gap-2">
                 <input 
                  type="range" min="2" max="5" 
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gwf-border rounded-lg appearance-none cursor-pointer accent-gwf-primary" 
                />
                <span className="text-xl font-black font-display italic text-gwf-primary w-6">{formData.maxMembers}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gwf-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <Clock size={14} /> Duration (m)
              </label>
              <input 
                type="number" 
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                className="w-full bg-gwf-card/30 border border-gwf-border rounded-xl py-2 px-4 focus:ring-2 focus:ring-gwf-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gwf-muted uppercase tracking-widest ml-1">Script Source</label>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setFormData({...formData, scriptSource: 'AI-Generated'})}
                className={`flex-1 min-w-[120px] p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  formData.scriptSource === 'AI-Generated' ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg glow-amber' : 'bg-gwf-card/30 border-gwf-border opacity-50'
                }`}
              >
                <Sparkles size={24} />
                <span className="text-sm font-bold">AI Magic</span>
              </button>
              <button 
                onClick={() => setFormData({...formData, scriptSource: 'Library'})}
                className={`flex-1 min-w-[120px] p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  formData.scriptSource === 'Library' ? 'bg-gwf-primary/10 border-gwf-primary text-gwf-primary shadow-lg glow-primary' : 'bg-gwf-card/30 border-gwf-border opacity-50'
                }`}
              >
                <Library size={24} />
                <span className="text-sm font-bold">Library</span>
              </button>
              <button 
                onClick={() => setFormData({...formData, scriptSource: 'Excel'})}
                className={`flex-1 min-w-[120px] p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  formData.scriptSource === 'Excel' ? 'bg-gwf-secondary/10 border-gwf-secondary text-gwf-secondary opacity-50' : 'bg-gwf-card/30 border-gwf-border opacity-50'
                }`}
              >
                <FileSpreadsheet size={24} />
                <span className="text-sm font-bold">Excel</span>
              </button>
            </div>
          </div>

          {formData.scriptSource === 'Library' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 rounded-3xl border-gwf-primary/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-gwf-primary tracking-[0.2em]">Selected Script</p>
                <button 
                  onClick={() => navigate('/scripts')}
                  className="text-[10px] font-black uppercase text-gwf-muted hover:text-gwf-primary transition-colors underline underline-offset-4"
                >
                  Change Script
                </button>
              </div>
              {selectedScript ? (
                <div className="space-y-1">
                  <h4 className="text-xl font-black italic text-white">{selectedScript.title}</h4>
                  <p className="text-xs text-gwf-muted font-medium">{selectedScript.contextTag} • {selectedScript.utterances.length} Patterns</p>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-gwf-muted italic">No script selected from library yet.</p>
                  <button 
                    onClick={() => navigate('/scripts')}
                    className="mt-4 px-6 py-2 bg-gwf-primary/10 text-gwf-primary rounded-xl text-xs font-bold uppercase"
                  >
                    Browse Library
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {formData.scriptSource === 'AI-Generated' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-amber-500">Grammar Focus</label>
                    <select 
                      value={formData.grammarFocus}
                      onChange={(e) => setFormData({...formData, grammarFocus: e.target.value})}
                      className="w-full bg-gwf-bg border border-gwf-border rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                    >
                      {GRAMMAR_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-amber-500">Context</label>
                    <input 
                      type="text" 
                      value={formData.context}
                      onChange={(e) => setFormData({...formData, context: e.target.value})}
                      className="w-full bg-gwf-bg border border-gwf-border rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                    />
                 </div>
              </div>
              <div className="glass p-4 rounded-2xl space-y-3">
                <label className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
                   <Cpu size={12} /> Topic / Scenario
                </label>
                <textarea 
                  placeholder="Describe the scenario (e.g., 'Discussing home renovation in an excited tone')"
                  value={formData.aiPrompt}
                  onChange={(e) => setFormData({...formData, aiPrompt: e.target.value})}
                  className="w-full bg-gwf-bg/50 border border-gwf-border rounded-xl py-3 px-4 focus:ring-1 focus:ring-amber-500 outline-none h-24 text-sm"
                />
              </div>
            </motion.div>
          )}
        </section>

        <button 
          onClick={handleCreate}
          disabled={loading || (formData.scriptSource === 'Library' && !formData.scriptId)}
          className="w-full bg-gwf-primary hover:bg-gwf-primary/90 text-white font-black py-5 rounded-2xl transition-all shadow-xl hover:shadow-gwf-primary/30 flex items-center justify-center gap-3 text-xl group disabled:opacity-50 disabled:grayscale"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>SYNC NOW <Send size={24} className="group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </main>
    </div>
  );
}
