import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Speaker, 
  Mic, 
  MicOff, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  RotateCcw, 
  Timer,
  Info,
  ChevronRight,
  TrendingUp,
  Zap
} from 'lucide-react';
import { TurnState, VoiceAnalysis } from '@/types';
import { voiceService } from '@/lib/voiceAnalysisService';

interface SpeakerScreenProps {
  turnState: TurnState;
  timer: number;
  onDone: (analysis: VoiceAnalysis) => void;
  onSkip?: () => void;
}

export default function SpeakerScreen({ turnState, timer, onDone, onSkip }: SpeakerScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMicToggle = () => {
    if (isRecording) {
      stopAndAnalyze();
    } else {
      setTranscript('');
      setAnalysis(null);
      setIsRecording(true);
      voiceService.startRecording((t) => setTranscript(t));
    }
  };

  const stopAndAnalyze = () => {
    voiceService.stopRecording();
    setIsRecording(false);
    
    const res = voiceService.analyzeTranscript(
      transcript,
      turnState.utterance.englishText,
      turnState.sessionId,
      turnState.activeMemberId,
      turnState.turnIndex,
      turnState.utterance.sequenceId
    );
    setAnalysis(res);
    return res;
  };

  // Auto-submit logic: When transcript matches target text with high confidence
  useEffect(() => {
    if (!isRecording || !transcript) return;

    const targetText = turnState.utterance.englishText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const currentTranscript = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

    // If transcript is long enough and contains majority of target text
    if (currentTranscript.length >= targetText.length * 0.95) {
      const res = stopAndAnalyze();
      
      // If fluency is high enough, auto-advance after a small delay for feedback visibility
      if (res.fluencyScore >= 85) {
        const timeout = setTimeout(() => {
          onDone(res);
        }, 1500);
        return () => clearTimeout(timeout);
      }
    }
  }, [transcript, isRecording, turnState.utterance.englishText]);

  const wrapFocusWord = (text: string, focusWord?: string) => {
    if (!focusWord) return text;
    const parts = text.split(new RegExp(`(${focusWord})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === focusWord.toLowerCase() 
        ? <span key={i} className="text-gwf-accent drop-shadow-[0_0_15px_rgba(255,165,0,0.4)]">{part}</span> 
        : part
    );
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white flex flex-col items-center p-6 selection:bg-gwf-primary/30">
      <div className="w-full max-w-sm flex flex-col h-full gap-8">
        
        {/* Top bar */}
        <div className="flex items-center justify-between pt-6">
           <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-gwf-primary animate-pulse" />
                 Utterance {turnState.turnIndex + 1} / {turnState.totalTurns}
              </p>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(5, turnState.totalTurns) }).map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < (turnState.turnIndex % 5) + 1 ? 'w-6 bg-gwf-primary' : 'w-2 bg-white/10'}`} />
                ))}
              </div>
           </div>
           <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl">
              <Timer size={14} className="text-gwf-accent animate-pulse" />
              <span className="font-mono text-sm font-black tabular-nums tracking-wider">{formatTime(timer)}</span>
           </div>
        </div>

        {/* Utterance Card */}
        <motion.div 
           layout
           className="flex-1 flex flex-col justify-center space-y-10 py-6"
        >
           <div className="space-y-8 text-center relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-5 pointer-events-none">
                 <Speaker size={120} />
              </div>
              
              <div>
                <span className="px-5 py-2 bg-gwf-accent/10 text-gwf-accent border border-gwf-accent/20 rounded-2xl text-[10px] font-black uppercase tracking-widest italic backdrop-blur-sm">
                   {turnState.utterance.grammarTag || 'Sentence Practice'}
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tight leading-[1.05] selection:bg-gwf-accent/40 px-2">
                 {wrapFocusWord(turnState.utterance.englishText, turnState.utterance.focusWord)}
              </h2>

              {turnState.utterance.pronunciationNote && (
                <div className="flex items-center justify-center gap-2 text-xs text-white/40 font-bold italic">
                  <Info size={14} className="text-gwf-primary" />
                  <p>{turnState.utterance.pronunciationNote}</p>
                </div>
              )}
           </div>

           <div className="flex flex-col items-center gap-4">
              <button 
                onClick={() => setShowHint(!showHint)}
                className="text-[10px] font-black uppercase text-white/30 hover:text-white transition-colors flex items-center gap-2 group"
              >
                {showHint ? <EyeOff size={14} /> : <Eye size={14} />}
                {showHint ? 'Hide Sync Hint' : 'Show Hint'}
              </button>
              
              <AnimatePresence>
                {showHint && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xl font-bold italic text-gwf-accent text-center"
                  >
                    {turnState.utterance.hintText}
                  </motion.p>
                )}
              </AnimatePresence>
           </div>
        </motion.div>

        {/* Recording Section */}
        <div className="space-y-8 pb-10">
           <div className="flex flex-col items-center gap-6">
              <div className="relative">
                 {isRecording && (
                   <motion.div 
                     animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                     transition={{ repeat: Infinity, duration: 1.5 }}
                     className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
                   />
                 )}
                 <button 
                    onClick={handleMicToggle}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10 ${
                      isRecording ? 'bg-emerald-500 scale-110' : 'bg-gwf-primary hover:scale-105 active:scale-95'
                    }`}
                 >
                    {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                 </button>
              </div>

              <div className="h-12 text-center overflow-hidden">
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.p 
                      key="recording"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-sm font-medium italic text-white/50"
                    >
                      {transcript || 'Listening to your sync...'}
                    </motion.p>
                  ) : analysis ? (
                    <motion.div 
                      key="analysis"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex gap-4"
                    >
                       <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                          <Zap size={12} className="text-gwf-accent" />
                          <span className="text-[10px] font-bold text-white/60">Fluency: {analysis.fluencyScore}%</span>
                       </div>
                       <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                          <TrendingUp size={12} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-white/60">Speed: {analysis.speakingSpeedWPM} wpm</span>
                       </div>
                    </motion.div>
                  ) : (
                    <motion.p 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-black uppercase tracking-widest text-white/20"
                    >
                      Tap microphone to start sync
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
           </div>

           <div className="flex flex-col gap-3 relative pb-4">
              <div className="absolute inset-x-0 -top-6 flex justify-center opacity-40 pointer-events-none">
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gwf-primary to-transparent blur-sm" />
              </div>
              
              <button 
                onClick={() => analysis && onDone(analysis)}
                disabled={!analysis}
                className={`w-full py-5 rounded-[28px] font-black text-xl italic flex items-center justify-center gap-3 transition-all duration-300 transform ${
                  analysis 
                  ? 'bg-gwf-primary text-white shadow-[0_20px_50px_rgba(108,99,255,0.4)] hover:scale-[1.02] active:scale-95' 
                  : 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed opacity-50'
                }`}
              >
                Done Speaking <CheckCircle2 size={24} className={analysis ? 'animate-bounce' : ''} />
              </button>
              
              <div className="flex justify-between items-center px-4 mt-2">
                 {turnState.reReadAllowed && (
                   <button 
                     onClick={() => { setAnalysis(null); setTranscript(''); }}
                     className="text-[10px] font-black uppercase text-white/40 hover:text-white flex items-center gap-2"
                   >
                     <RotateCcw size={12} /> Re-Read ({turnState.reReadCount}/{turnState.maxReReads})
                   </button>
                 )}
                 {onSkip && (
                   <button 
                     onClick={onSkip}
                     className="text-[10px] font-black uppercase text-white/20 hover:text-white"
                   >
                     Skip for now
                   </button>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
