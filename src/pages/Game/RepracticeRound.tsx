import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Mic, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  X,
  ArrowRight,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Mistake, VoiceAnalysis } from '@/types';
import { voiceAnalysisService } from '@/lib/voiceAnalysisService';
import { repracticeService } from '@/lib/repracticeService';
import { toastService } from '@/lib/toastService';

export default function RepracticeRound() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchPracticeMistakes = async () => {
      try {
        const data = await repracticeService.getMistakesByUser(user.id);
        const pending = data.filter(m => !m.resolved);
        setMistakes(pending);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPracticeMistakes();
  }, [user]);

  const toggleRecording = () => {
    if (isRecording) {
      voiceAnalysisService.stopRecording();
      setIsRecording(false);
    } else {
      const currentMistake = mistakes[currentIndex];
      if (!currentMistake) return;

      setTranscript('');
      setAnalysis(null);
      setIsRecording(true);
      
      voiceAnalysisService.startRecording(
        (text) => setTranscript(text)
      );
    }
  };

  const handleDone = async () => {
    const currentMistake = mistakes[currentIndex];
    if (!currentMistake || !transcript) return;
    
    setIsEvaluating(true);
    try {
      const result = voiceAnalysisService.analyzeSpeech(
        transcript,
        currentMistake.utteranceText,
        user?.id || 'anonymous',
        'REPRACTICE',
        currentMistake.utteranceId
      );

      setAnalysis(result);

      // Record in DB
      const resolved = await repracticeService.recordRepracticeAttempt(currentMistake.id, result);
      
      if (resolved) {
        toastService.success('Mistake Resolved! 🎉');
      }
    } catch (err) {
      console.error(err);
      toastService.error('Analysis failed. Try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextMistake = () => {
    if (currentIndex < mistakes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTranscript('');
      setAnalysis(null);
    } else {
      setCurrentIndex(mistakes.length);
    }
  };

  if (loading) return (
     <div className="min-h-screen focus-mode flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gwf-primary"></div>
     </div>
  );

  const currentMistake = mistakes[currentIndex];

  if (mistakes.length === 0 || currentIndex >= mistakes.length) return (
    <div className="min-h-screen focus-mode flex flex-col items-center justify-center p-8 text-center space-y-8">
       <motion.div 
         initial={{ scale: 0.5, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="w-32 h-32 bg-gwf-success/20 rounded-[40px] flex items-center justify-center text-gwf-success shadow-[0_0_50px_rgba(34,197,94,0.2)]"
       >
          <CheckCircle2 size={64} />
       </motion.div>
       <div className="space-y-4">
         <h2 className="text-4xl font-black italic tracking-tight text-white">Sync Complete! 🎉</h2>
         <p className="text-white/40 font-medium max-w-xs mx-auto">You've successfully refined your rhythm and resolved your sync challenges.</p>
       </div>
       
       <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="glass p-4 rounded-3xl border border-white/5 text-center">
             <p className="text-2xl font-black italic text-gwf-success">100%</p>
             <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Accuracy</p>
          </div>
          <div className="glass p-4 rounded-3xl border border-white/5 text-center">
             <p className="text-2xl font-black italic text-gwf-accent">+45%</p>
             <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Improvement</p>
          </div>
       </div>

       <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
          <button onClick={() => navigate('/')} className="btn-primary h-14 rounded-2xl shadow-xl shadow-gwf-primary/20">Go to Dashboard</button>
          <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">Practice Again</button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen focus-mode text-white flex flex-col selection:bg-gwf-primary/30 overflow-hidden">
       {/* Background Decorative Blur */}
       <div className="absolute top-1/4 -left-20 w-64 h-64 bg-gwf-primary/5 rounded-full blur-[100px]" />
       <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-gwf-accent/5 rounded-full blur-[100px]" />

       <header className="p-6 flex items-center justify-between relative z-10">
          <button onClick={() => navigate('/user/mistakes')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
             <X size={20} className="text-white/50" />
          </button>
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black uppercase tracking-[.3em] text-white/30 italic">Correction Round</span>
             <span className="text-[11px] font-black text-gwf-primary">Sync {currentIndex + 1} of {mistakes.length}</span>
          </div>
          <div className="w-12 h-12" />
       </header>

       <main className="flex-1 max-w-lg mx-auto w-full p-8 flex flex-col items-center justify-center space-y-12 relative z-10">
          {/* Progress Bar */}
          <div className="w-full flex items-center gap-3">
             <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentIndex + 1) / mistakes.length) * 100}%` }}
                   className="h-full bg-gwf-accent shadow-[0_0_10px_rgba(255,165,0,0.5)]"
                />
             </div>
             <span className="text-[10px] font-black text-white/20 tabular-nums">
                {Math.round(((currentIndex + 1) / mistakes.length) * 100)}%
             </span>
          </div>

          {/* Mistake Context Card */}
          <div className="w-full space-y-8 text-center">
             <div className="glass rounded-[40px] p-8 border-t-2 border-gwf-error/20 space-y-6 shadow-2xl relative group">
                <div className="absolute -top-3 left-8 px-3 py-1 bg-gwf-error text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                   Previous Sync Miss
                </div>
                
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-gwf-error/70 justify-center">
                      <AlertCircle size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">You mentioned:</span>
                   </div>
                   <p className="text-2xl font-black italic text-gwf-error/40 line-through decoration-gwf-error decoration-2 leading-tight">
                      "{currentMistake.spokenText}"
                   </p>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-2">
                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 justify-center">
                      <CheckCircle2 size={12} /> The Fix:
                   </p>
                   <p className="text-sm font-bold text-white/90 italic leading-relaxed">
                      {currentMistake.mistakeDetail}
                   </p>
                </div>
             </div>

             <div className="text-center space-y-4 py-4">
                <p className="text-[10px] font-black text-gwf-primary uppercase tracking-[.4em] italic opacity-60">Now Say This Sync:</p>
                <h2 className="text-4xl font-black italic tracking-tight leading-[1.1] selection:bg-gwf-primary/40">
                   {currentMistake.utteranceText}
                </h2>
             </div>
          </div>

          {/* Voice Input Section */}
          <div className="w-full flex flex-col items-center gap-10">
             <div className="h-14 text-center px-6">
                <AnimatePresence mode="wait">
                   <motion.p 
                     key={isRecording ? 'rec' : 'idle'}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="text-white/40 italic font-medium text-base"
                   >
                     {transcript || (isRecording ? 'Listening for clear sync...' : 'Ready when you are...')}
                   </motion.p>
                </AnimatePresence>
             </div>

             <div className="relative">
                {isRecording && (
                   <motion.div 
                     animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                     transition={{ repeat: Infinity, duration: 1.5 }}
                     className="absolute inset-0 bg-gwf-primary rounded-full blur-2xl"
                   />
                )}
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleRecording}
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 shadow-2xl ${
                    isRecording 
                    ? 'bg-gwf-error border-4 border-white/20 scale-110' 
                    : 'bg-gwf-primary border-4 border-white/5 active:scale-95'
                  }`}
                >
                   {isRecording ? <X size={40} /> : <Mic size={40} />}
                </motion.button>
             </div>
          </div>

          {/* Feedback & Actions */}
          <div className="w-full min-h-[160px] flex items-center justify-center py-8">
             <AnimatePresence mode="wait">
                {transcript && !isRecording && !analysis && (
                   <motion.button 
                     key="eval"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     onClick={handleDone}
                     disabled={isEvaluating}
                     className="btn-primary w-full shadow-[0_20px_40px_rgba(108,99,255,0.3)] h-[70px] rounded-[24px] flex items-center justify-center gap-4 text-xl italic font-black"
                   >
                     {isEvaluating ? (
                       <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <>Refine My Sync <TrendingUp size={24} /></>
                     )}
                   </motion.button>
                )}

                {analysis && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full p-8 glass border-2 border-white/10 rounded-[40px] flex flex-col items-center gap-6 shadow-2xl"
                  >
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
                         analysis.overallScore >= 80 
                         ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                         : 'bg-gwf-accent/20 text-gwf-accent shadow-[0_0_30px_rgba(255,165,0,0.2)]'
                      }`}>
                         {analysis.overallScore >= 80 ? <CheckCircle2 size={32} /> : <RotateCcw size={32} />}
                      </div>
                      
                      <div className="text-center space-y-4">
                         <div className="space-y-1">
                            <p className="text-xl font-black italic">
                               {analysis.overallScore >= 80 ? 'Perfect Sync!' : 'Focus and try again'}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                               Sync Accuracy: {analysis.overallScore}%
                            </p>
                         </div>
                      </div>

                      <button 
                        onClick={nextMistake} 
                        className="btn-primary w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-lg italic font-black shadow-lg shadow-gwf-primary/20"
                      >
                         {currentIndex < mistakes.length - 1 ? 'Next Sync Challenge' : 'Complete Lab Session'} <ArrowRight size={22} />
                      </button>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
       </main>
    </div>
  );
}
