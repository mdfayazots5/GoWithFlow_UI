import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Copy, 
  Play, 
  LogOut, 
  CircleDot,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { 
  doc, 
  collection, 
  onSnapshot, 
  updateDoc, 
  query, 
  setDoc, 
  deleteDoc,
  getDocs,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { Session, Member } from '@/types';

export default function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isDemo } = useAuth();
  
  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id || !user || (!auth.currentUser && !isDemo)) return;

    if (id === 'S005') {
      // Demo session data
      const demoSession: Session = {
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
      };
      // Demo members data - always include Ravi (Host), Priya (Member) + current user
      const isCurrentUserHost = user.id === 'U001';
      const isCurrentUserPriya = user.id === 'U002';
      
      const demoMembers: Member[] = [
        {
          id: 'U001-m',
          userId: 'U001',
          name: 'Ravi Kumar',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi',
          slot: 1,
          role: 'Host',
          ready: true,
          joinedAt: new Date().toISOString()
        },
        {
          id: 'U002-m',
          userId: 'U002',
          name: 'Priya Kumar',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
          slot: 2,
          role: 'Member',
          ready: true,
          joinedAt: new Date().toISOString()
        }
      ];

      if (!isCurrentUserHost && !isCurrentUserPriya) {
        demoMembers.push({
          id: `${user.id}-m`,
          userId: user.id,
          name: user.fullName || 'You',
          avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          slot: 3,
          role: 'Member',
          ready: false,
          joinedAt: new Date().toISOString()
        });
      }

      // Trigger session and members set
      setSession(demoSession);
      setMembers(demoMembers);
      return;
    }

    const sessionRef = doc(db, 'sessions', id);
    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Session;
        setSession({ id: snap.id, ...data });
        if (data.status === 'ACTIVE') {
          navigate(`/live-session/${id}`);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `sessions/${id}`));

    const membersRef = collection(db, 'sessions', id, 'members');
    const unsubMembers = onSnapshot(membersRef, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(list);

      // Self-join check (if user is not in the list, add them)
      const isMember = list.find(m => m.userId === user.id);
      if (!isMember && list.length < (session?.maxMembers || 5)) {
        const slot = findAvailableSlot(list, session?.maxMembers || 5);
        
        // Add member to subcollection
        setDoc(doc(membersRef, user.id), {
          userId: user.id,
          name: user.fullName,
          avatar: user.avatar,
          slot,
          role: session?.hostId === user.id ? 'Host' : 'Member',
          ready: session?.hostId === user.id ? true : false,
          joinedAt: new Date().toISOString(),
        }).then(() => {
          // Update parent session memberIds for querying/security
          return updateDoc(sessionRef, {
            memberIds: arrayUnion(user.id)
          });
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `sessions/${id}/members/${user.id}`));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, `sessions/${id}/members`));

    return () => {
      unsubSession();
      unsubMembers();
    };
  }, [id, user, auth.currentUser, session?.maxMembers, session?.hostId, navigate, isDemo]);

  const findAvailableSlot = (currentMembers: Member[], max: number) => {
    for (let i = 1; i <= max; i++) {
      if (!currentMembers.find(m => m.slot === i)) return i;
    }
    return currentMembers.length + 1;
  };

  const toggleReady = async () => {
    if (!id || !user) return;
    if (id === 'S005') {
      setMembers(prev => prev.map(m => m.userId === user.id ? { ...m, ready: !m.ready } : m));
      return;
    }
    const memberRef = doc(db, 'sessions', id, 'members', user.id);
    const myMember = members.find(m => m.userId === user.id);
    await updateDoc(memberRef, { ready: !myMember?.ready });
  };

  const startSession = async () => {
    if (!id || !session) return;
    
    if (id === 'S005') {
       navigate(`/live-session/${id}`);
       return;
    }

    // Set status to ACTIVE, which triggers navigation for all members
    await updateDoc(doc(db, 'sessions', id), { 
      status: 'ACTIVE',
      turnIndex: 0,
      activeSpeakerId: session.hostId, // Host starts first
      startedAt: serverTimestamp()
    });
  };

  const leaveSession = async () => {
    if (!id || !user) return;
    await deleteDoc(doc(db, 'sessions', id, 'members', user.id));
    await updateDoc(doc(db, 'sessions', id), {
      memberIds: arrayRemove(user.id)
    });
    navigate('/');
  };

  const copyCode = () => {
    if (session?.joinCode) {
      navigator.clipboard.writeText(session.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!session) return (
    <div className="min-h-screen bg-gwf-bg flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-gwf-primary/30 border-t-gwf-primary rounded-full animate-spin" />
    </div>
  );

  const isHost = session.hostId === user?.id;
  const allReady = members.length >= 2 && members.filter(m => m.role !== 'Host').every(m => m.ready);

  return (
    <div className="min-h-screen bg-gwf-bg pb-44">
       <header className="p-6 flex items-center justify-between sticky top-0 bg-gwf-bg/80 backdrop-blur-md z-20">
        <button onClick={() => navigate('/')} className="p-2 glass rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase text-gwf-muted tracking-widest leading-none">Sync Lobby</span>
          <h1 className="text-xl font-black font-display italic tracking-tight">{session.sessionName}</h1>
        </div>
        <button onClick={leaveSession} className="p-2 glass rounded-xl text-gwf-accent hover:bg-gwf-accent/10">
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-6 space-y-12 max-w-2xl mx-auto pt-8">
        {/* Join Code Display */}
         <div className="text-center space-y-6">
          <div className="inline-block glass p-10 rounded-[56px] glow-primary border-4 border-gwf-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gwf-primary/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-1000" />
            <span className="block text-[10px] font-black text-gwf-muted mb-4 uppercase tracking-[0.4em]">Invite Your Family</span>
            <div className="flex items-center gap-6">
              <h2 className="text-6xl font-black font-display tracking-widest text-gwf-primary italic drop-shadow-2xl">{session.joinCode}</h2>
              <button onClick={copyCode} className="p-3 bg-gwf-primary/10 hover:bg-gwf-primary/20 rounded-2xl transition-all text-gwf-primary transform hover:scale-110 active:scale-95">
                {copied ? <CheckCircle2 size={32} /> : <Copy size={32} />}
              </button>
            </div>
            {copied && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gwf-primary text-white text-[10px] font-black px-4 py-1 rounded-full"
              >
                COPIED TO CLIPBOARD
              </motion.div>
            )}
          </div>
          <p className="font-bold text-gwf-muted italic">Share this code with up to {session.maxMembers - 1} more person.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: session.maxMembers }).map((_, idx) => {
            const member = members.find(m => m.slot === idx + 1);
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`aspect-square rounded-[48px] flex flex-col items-center justify-center gap-4 transition-all relative border-2 ${
                  member ? 'glass border-gwf-primary/30 glow-primary scale-100' : 'bg-gwf-card/5 border-gwf-border border-dashed opacity-50 scale-95'
                }`}
              >
                <div className="absolute top-6 left-6 text-[10px] font-black font-display text-gwf-muted/20">
                  SLOT {idx + 1}
                </div>
                {member ? (
                  <>
                    <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-gwf-primary/20 shadow-2xl relative group">
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      {member.role === 'Host' && (
                        <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-[8px] font-black text-white text-center py-1 uppercase tracking-widest">
                          Host
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="font-black text-sm italic">{member.userId === user?.id ? 'You' : member.name}</p>
                      <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${
                        member.ready || member.role === 'Host' ? 'bg-gwf-primary text-white' : 'bg-gwf-border text-gwf-muted animate-pulse'
                      }`}>
                        {member.role === 'Host' ? 'Host Ready' : member.ready ? 'Ready' : 'Waiting...'}
                      </div>
                    </div>
                    {(member.ready || member.role === 'Host') && (
                       <motion.div 
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -top-3 -right-3 bg-gwf-primary text-white p-2.5 rounded-2xl shadow-xl border-4 border-gwf-bg"
                       >
                          <CheckCircle2 size={20} />
                       </motion.div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-3xl bg-gwf-border/10 flex items-center justify-center text-gwf-muted/10 border-2 border-gwf-border/20 border-dashed">
                      <CircleDot size={40} strokeWidth={1} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-gwf-muted/20 tracking-[0.2em] italic">Open Slot</span>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Persistent Footer Action */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-gwf-bg via-gwf-bg/95 to-transparent z-30">
        <div className="max-w-2xl mx-auto">
          {isHost ? (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startSession}
              disabled={!allReady}
              className="w-full bg-gwf-primary hover:bg-gwf-primary/90 disabled:opacity-50 disabled:grayscale text-white font-black py-7 rounded-[32px] transition-all shadow-2xl glow-primary flex items-center justify-center gap-4 text-2xl uppercase italic tracking-tight group"
            >
              START THE SYNC <Play size={28} className="fill-white group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleReady}
              className={`w-full font-black py-7 rounded-[32px] transition-all shadow-2xl flex items-center justify-center gap-4 text-2xl uppercase italic tracking-tight ${
                members.find(m => m.userId === user?.id)?.ready 
                ? 'bg-emerald-500 text-white glow-accent border-b-8 border-emerald-700' 
                : 'bg-gwf-primary text-white glow-primary border-b-8 border-indigo-900'
              }`}
            >
              {members.find(m => m.userId === user?.id)?.ready ? 'I AM SYNCED! ✅' : 'DECLARE READY 🚀'}
            </motion.button>
          )}
          
          <AnimatePresence>
            {!allReady && isHost && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-[10px] font-black text-gwf-muted mt-4 uppercase tracking-widest"
              >
                Waiting for at least 1 more member to be ready
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </footer>
    </div>
  );
}
