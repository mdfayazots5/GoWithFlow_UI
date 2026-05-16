import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  ThumbsUp, 
  MessageSquare, 
  AlertCircle, 
  Ear,
  ChevronRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { TurnState, Member } from '@/types';

interface ListenerScreenProps {
  turnState: TurnState;
  activeSpeaker: Member | null;
  onFeedback: (tag: string) => void;
  nextTurns: number;
}

export default function ListenerScreen({ turnState, activeSpeaker, onFeedback, nextTurns }: ListenerScreenProps) {
  return (
    <div className="min-h-screen bg-[#12121A] text-white flex flex-col items-center p-6 pb-12 overflow-hidden relative">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-gwf-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-gwf-accent/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm flex flex-col h-full gap-10 relative z-10">
        
        {/* Top Indicator */}
        <div className="pt-8 text-center space-y-4">
           <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Live Sync Engine Active</p>
           </div>
           <div className="space-y-1">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-black italic text-white flex items-center justify-center gap-3"
              >
                 <span className="text-gwf-accent animate-mic">🎙</span> 
                 {activeSpeaker?.name || 'Partner'} is speaking...
              </motion.h2>
           </div>
        </div>

        {/* Speaker Avatar & Animation */}
        <div className="flex justify-center py-4">
           <div className="relative">
              <motion.div 
                 animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                 transition={{ repeat: Infinity, duration: 4 }}
                 className="absolute inset-0 bg-gwf-primary rounded-full blur-3xl"
              />
              <div className="w-36 h-36 rounded-[48px] border-4 border-white/10 overflow-hidden relative z-10 shadow-2xl bg-white/5 backdrop-blur-sm">
                 <img 
                   src={activeSpeaker?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeSpeaker?.name}`} 
                   className="w-full h-full object-cover" 
                   alt={activeSpeaker?.name}
                 />
              </div>
           </div>
        </div>

        {/* Transcribed Text Preview */}
        <div className="glass p-8 rounded-[40px] border-t-2 border-gwf-accent/30 space-y-4 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-5">
              <Ear size={64} className="text-white" />
           </div>
           
           <p className="text-[10px] font-black uppercase tracking-widest text-gwf-accent flex items-center gap-2">
              <Ear size={12} /> Reading Now
           </p>
           <p className="text-3xl font-black italic text-white leading-tight">
              "{turnState.utterance.englishText}"
           </p>
           <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gwf-accent" />
              <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                 {turnState.utterance.grammarTag || 'General Fluency'}
              </p>
           </div>
        </div>

        {/* Feedback Panel */}
        <div className="space-y-6">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 text-center">Anonymous Tap Feedback</p>
           <div className="grid grid-cols-2 gap-4">
              <FeedbackButton 
                icon={<ThumbsUp size={20} />} 
                label="Perfect" 
                color="hover:border-emerald-500/50 hover:text-emerald-400 active:bg-emerald-500/10"
                onClick={() => onFeedback('GOOD')}
              />
              <FeedbackButton 
                icon={<TrendingDown size={20} />} 
                label="Hesitation" 
                color="hover:border-gwf-accent/50 hover:text-gwf-accent active:bg-gwf-accent/10"
                onClick={() => onFeedback('HESITATED')}
              />
              <FeedbackButton 
                icon={<AlertCircle size={20} />} 
                label="Mistake" 
                color="hover:border-gwf-error/50 hover:text-gwf-error active:bg-gwf-error/10"
                onClick={() => onFeedback('MISTAKE')}
              />
              <FeedbackButton 
                icon={<Volume2 size={20} />} 
                label="Unclear" 
                color="hover:border-gwf-primary/50 hover:text-gwf-primary active:bg-gwf-primary/10"
                onClick={() => onFeedback('UNCLEAR')}
              />
           </div>
        </div>

        {/* Footer Info */}
        <div className="mt-auto pb-4 space-y-6">
           <div className="p-5 bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-gwf-secondary/20 flex items-center justify-center text-gwf-secondary">
                    <Sparkles size={16} />
                 </div>
                 <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Your turn is in</p>
              </div>
              <p className="text-xl font-black italic text-gwf-secondary">{nextTurns} turns</p>
           </div>
           
           <div className="px-4 opacity-30 text-center">
              <p className="text-[8px] font-black uppercase tracking-widest leading-relaxed">
                 Listen carefully for natural rhythm<br/>
                 Help your partner with quality feedback
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}

function FeedbackButton({ icon, label, onClick, color }: { icon: React.ReactNode, label: string, onClick: () => void, color: string }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`glass p-4 rounded-3xl border border-white/5 flex flex-col items-center gap-2 transition-all ${color}`}
    >
       <div className="opacity-70">{icon}</div>
       <span className="text-[10px] font-bold tracking-tight uppercase">{label}</span>
    </motion.button>
  );
}
