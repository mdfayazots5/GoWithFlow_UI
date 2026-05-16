import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  DoorOpen, 
  Search,
  Users,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Session } from '@/types';

export default function JoinSession() {
  const { isDemo } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundSession, setFoundSession] = useState<Session | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');

    // Demo / Shortcut code logic
    if (code === '123456') {
      setTimeout(() => {
        setFoundSession({
          id: 'S005',
          sessionName: 'Family Game Night (Demo)',
          sessionMode: 'Together',
          status: 'LOBBY',
          maxMembers: 4,
          sessionDuration: 30,
          joinCode: '123456',
          hostId: 'U001',
          memberIds: ['U001'],
          scriptId: 'SC001',
          currentUtteranceIndex: 0,
          createdDate: new Date().toISOString()
        } as Session);
        setLoading(false);
      }, 800);
      return;
    }

    if (!auth.currentUser && !isDemo) {
      setError('Please login to search rooms');
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'sessions'), where('joinCode', '==', code.toUpperCase()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setFoundSession({ id: snap.docs[0].id, ...data } as Session);
      } else {
        setError('Session not found. Double check the code!');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (foundSession) {
      navigate(`/session/lobby/${foundSession.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gwf-bg">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-gwf-bg/80 backdrop-blur-md z-20">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black font-display uppercase tracking-widest">Join Room</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 space-y-10 max-w-xl mx-auto pt-8">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-24 h-24 bg-gwf-primary/10 text-gwf-primary rounded-[32px] flex items-center justify-center mx-auto border-2 border-gwf-primary/30 glow-primary"
          >
            <DoorOpen size={48} />
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black font-display italic tracking-tighter">Enter Sync Code</h2>
            <p className="text-gwf-muted font-medium italic">Join your family's practice room</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gwf-primary/5 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            <input 
              type="text" 
              maxLength={6}
              autoFocus
              placeholder="000 000"
              value={code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setCode(val);
                if (val.length === 6) handleSearch();
              }}
              className="w-full bg-gwf-bg border-4 border-gwf-border rounded-[40px] py-8 px-6 text-center text-5xl font-black font-display tracking-[0.3em] focus:border-gwf-primary focus:ring-4 focus:ring-gwf-primary/10 outline-none transition-all placeholder:text-gwf-muted/10 text-gwf-primary uppercase relative z-10"
            />
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 z-20"
                >
                  <div className="w-8 h-8 border-4 border-gwf-primary/20 border-t-gwf-primary rounded-full animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleSearch}
            disabled={code.length !== 6 || loading}
            className="w-full bg-gwf-primary hover:bg-gwf-primary/90 disabled:opacity-50 text-white font-black py-6 rounded-3xl transition-all shadow-2xl glow-primary flex items-center justify-center gap-3 text-2xl uppercase italic tracking-tight"
          >
            LOCATE ROOM <Search size={28} />
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-gwf-accent font-bold"
            >
              {error}
            </motion.p>
          )}

          {foundSession && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[40px] glow-primary space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gwf-border pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-gwf-primary tracking-widest">{foundSession.sessionMode}</span>
                  <h3 className="text-2xl font-black">{foundSession.sessionName}</h3>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-gwf-muted">HOST</span>
                  <span className="font-bold text-sm">Family Member</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-gwf-muted" />
                  <div>
                    <span className="block text-xs font-bold text-gwf-muted">CAPACITY</span>
                    <span className="font-bold">{foundSession.maxMembers} Seats</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-gwf-muted" />
                  <div>
                    <span className="block text-xs font-bold text-gwf-muted">TIME</span>
                    <span className="font-bold">{foundSession.sessionDuration} Min</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleJoin}
                className="w-full bg-gwf-accent hover:bg-gwf-accent/90 text-white font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                CLAIM MY SEAT <ShieldCheck size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
