import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Session, Member, Script, VoiceAnalysis } from '@/types';
import SpeakerScreen from '@/components/Game/SpeakerScreen';
import ListenerScreen from '@/components/Game/ListenerScreen';
import { X } from 'lucide-react';
import { websocketService } from '@/lib/websocketService';
import { useTurnState } from '@/lib/hooks/useTurnState';
import { assessmentService } from '@/lib/assessmentService';

export default function SessionRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const turnState = useTurnState();
  
  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [turnStartTime, setTurnStartTime] = useState(0);
  const timerRef = useRef<any>(null);

  // Reset turn timer when turn shifts
  useEffect(() => {
    setTurnStartTime(timer);
  }, [turnState.turnIndex, turnState.activeMemberId]);

  const turnTimeElapsed = timer - turnStartTime;

  // Auto-skip logic: If user is silent for too long (e.g. 45s)
  useEffect(() => {
    if (turnState.activeMemberId === user?.id && turnTimeElapsed > 45) {
      console.log('[SESSION] Auto-skipping due to timeout');
      handleAnalysisDone({ 
        sessionId: id!, userId: user!.id, turnIndex: turnState.turnIndex, 
        utteranceId: turnState.utterance.sequenceId, transcribedText: 'TIMEOUT_AUTO_SKIP',
        expectedText: turnState.utterance.englishText, fluencyScore: 0,
        confidenceScore: 0, speakingSpeedWPM: 0, pauseCount: 0,
        pauseTimings: [], hesitationWords: [], repeatedWords: [],
        grammarErrors: [], pronunciationIssues: [], overallScore: 0,
        recordedAt: new Date().toISOString()
      });
    }
  }, [turnTimeElapsed]);

  useEffect(() => {
    if (!id || !user) return;

    if (id === 'S005') {
      // Setup demo members - always include Ravi (Host), Priya (Member) + current user
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
          ready: true,
          joinedAt: new Date().toISOString()
        });
      }
      setMembers(demoMembers);

      // Setup demo session
      setSession({
        id: 'S005',
        sessionName: 'Family Game Night (Demo)',
        sessionMode: 'Together',
        status: 'ACTIVE',
        maxMembers: 4,
        sessionDuration: 30,
        joinCode: '123456',
        hostId: 'U001',
        memberIds: demoMembers.map(m => m.userId),
        scriptId: 'SC001',
        currentUtteranceIndex: 0,
        createdDate: new Date().toISOString()
      });

      // Set demo script
      import('@/data/dummy/script.dummy').then(({ DUMMY_SCRIPTS }) => {
        setScript(DUMMY_SCRIPTS[0]);
        setLoading(false);
      });

      // Connect to WebSocket simulation
      websocketService.connect(id, user.id);
      
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

      return () => {
        websocketService.disconnect();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }

    // Connect to WebSocket (M03 Core)
    websocketService.connect(id, user.id);

    // Timer logic
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    // Sync basic session info from FireStore
    const unsubSession = onSnapshot(doc(db, 'sessions', id), async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Session;
        setSession({ id: snap.id, ...data });

        if (data.status === 'COMPLETED') {
          navigate(`/assessment/report/${id}`);
        }

        if (data.scriptId) {
          const sSnap = await getDoc(doc(db, 'scripts', data.scriptId));
          if (sSnap.exists()) {
            setScript({ id: sSnap.id, ...sSnap.data() } as Script);
          }
        }
        setLoading(false);
      }
    });

    const unsubMembers = onSnapshot(collection(db, 'sessions', id, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
    });

    return () => {
      unsubSession();
      unsubMembers();
      websocketService.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, user, navigate]);

  const handleAnalysisDone = async (analysis: VoiceAnalysis) => {
    if (!id || !session) return;

    // M04: Save assessment and handle mistakes via service
    await assessmentService.saveEvaluation(
      analysis, 
      session.scriptId, 
      turnState.utterance.grammarTag,
      script?.category
    );

    // M03: Broadcast TURN_COMPLETE via WebSocket
    websocketService.emit('TURN_COMPLETE', {
      memberId: user?.id,
      turnIndex: turnState.turnIndex,
      analysisScore: analysis.overallScore
    });

    // FireStore Fallback for turn shift (if not fully WS)
    if (script && id !== 'S005') {
      const nextTurnIndex = turnState.turnIndex + 1;
      if (nextTurnIndex >= script.utterances.length) {
        await updateDoc(doc(db, 'sessions', id), { status: 'COMPLETED' });
      } else {
        const nextUtterance = script.utterances[nextTurnIndex];
        const targetingSlot = (nextUtterance.sequenceId % session.maxMembers!) || session.maxMembers!;
        const nextMember = members.find(m => m.slot === targetingSlot) || members[0];

        await updateDoc(doc(db, 'sessions', id), {
          turnIndex: nextTurnIndex,
          activeSpeakerId: nextMember?.userId || user?.id
        });
      }
    }
  };

  const handleFeedback = (tag: string) => {
    websocketService.emit('LISTENER_FEEDBACK', {
      tag,
      targetTurnIndex: turnState.turnIndex
    });
  };

  if (loading || !session || !turnState.sessionId) {
    return (
    <div className="min-h-screen focus-mode flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-gwf-primary/30 border-t-gwf-primary rounded-full animate-spin" />
        <p className="text-gwf-muted font-black uppercase tracking-widest text-[10px]">Initializing Sync Engine...</p>
      </div>
    );
  }

  const isActive = turnState.activeMemberId === user?.id;
  const activeSpeaker = members.find(m => m.userId === turnState.activeMemberId) || null;
  const mySlot = members.find(m => m.userId === user?.id)?.slot || 0;
  
  const turnsToMe = (turnState.activeSlotIndex <= mySlot) 
    ? (mySlot - turnState.activeSlotIndex) 
    : (session.maxMembers! - turnState.activeSlotIndex + mySlot);

  return (
    <div className="min-h-screen focus-mode selection:bg-gwf-primary/30">
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
         <div className="pointer-events-auto">
            <h1 className="text-white/40 font-black italic uppercase text-[10px] tracking-widest bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
               {session.sessionName}
            </h1>
         </div>
         <button 
           onClick={() => navigate('/')}
           className="p-3 bg-white/5 hover:bg-gwf-error/20 text-white/50 hover:text-gwf-error rounded-2xl border border-white/10 backdrop-blur-md transition-all pointer-events-auto"
         >
            <X size={20} />
         </button>
      </div>

      {isActive ? (
        <SpeakerScreen 
          turnState={turnState}
          timer={timer}
          onDone={handleAnalysisDone}
          onSkip={() => handleAnalysisDone({ 
            sessionId: id!, userId: user!.id, turnIndex: turnState.turnIndex, 
            utteranceId: turnState.utterance.sequenceId, transcribedText: 'SKIPPED',
            expectedText: turnState.utterance.englishText, fluencyScore: 0,
            confidenceScore: 0, speakingSpeedWPM: 0, pauseCount: 0,
            pauseTimings: [], hesitationWords: [], repeatedWords: [],
            grammarErrors: [], pronunciationIssues: [], overallScore: 0,
            recordedAt: new Date().toISOString()
          })}
        />
      ) : (
        <ListenerScreen 
          turnState={{...turnState, totalTurns: script?.utterances.length || 0}}
          activeSpeaker={activeSpeaker}
          onFeedback={handleFeedback}
          nextTurns={turnsToMe}
        />
      )}
    </div>
  );
}
