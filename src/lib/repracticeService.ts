import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Mistake, RepracticeSession, RepracticeUtterance, VoiceAnalysis } from '@/types';
import { isDemo } from './demoService';

class RepracticeService {
  async generateRepracticeSession(userId: string, sourceSessionId?: string): Promise<RepracticeSession> {
    if (isDemo) {
       return {
         id: 'DEMO_REPRACTICE',
         userId,
         sourceSessionId: 'all',
         generatedDate: new Date().toISOString(),
         mistakeIds: ['M001'],
         totalMistakes: 1,
         completedRounds: 0,
         improvementPercentage: 45,
         status: 'PENDING',
         utterances: [{
            originalUtteranceId: 1,
            englishText: 'I have been practicing my English every morning.',
            hintText: 'Keep rhythmic control.',
            mistakeType: 'HESITATION',
            mistakeDetail: 'Paused after "been"',
            correctionNote: 'Speak fluidly.',
            attemptCount: 1,
            bestScore: 78,
            lastScore: 78,
            resolved: false
         }]
       } as RepracticeSession;
    }

    const mistakesQuery = sourceSessionId 
      ? query(
          collection(db, 'mistakes'), 
          where('userId', '==', userId), 
          where('sessionId', '==', sourceSessionId),
          where('resolved', '==', false)
        )
      : query(
          collection(db, 'mistakes'), 
          where('userId', '==', userId), 
          where('resolved', '==', false),
          orderBy('firstOccurrence', 'desc')
        );

    const snapshot = await getDocs(mistakesQuery);
    const mistakes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Mistake));

    const typePriority: Record<string, number> = {
      'GRAMMAR': 1,
      'PRONUNCIATION': 2,
      'HESITATION': 3,
      'SKIP': 4,
      'INCOMPLETE': 5,
      'SPEED': 6
    };

    const sortedMistakes = mistakes.sort((a, b) => 
      (typePriority[a.mistakeType] || 99) - (typePriority[b.mistakeType] || 99)
    );

    const repracticeUtterances: RepracticeUtterance[] = sortedMistakes.map(m => ({
      originalUtteranceId: m.utteranceId,
      englishText: m.utteranceText,
      hintText: m.grammarTag || '',
      mistakeType: m.mistakeType,
      mistakeDetail: m.mistakeDetail,
      correctionNote: m.mistakeDetail || '',
      attemptCount: 0,
      bestScore: 0,
      lastScore: 0,
      resolved: false
    }));

    const sessionData: Partial<RepracticeSession> = {
      userId,
      sourceSessionId: sourceSessionId || 'all',
      generatedDate: new Date().toISOString(),
      mistakeIds: sortedMistakes.map(m => m.id),
      totalMistakes: sortedMistakes.length,
      completedRounds: 0,
      improvementPercentage: 0,
      status: 'PENDING',
      utterances: repracticeUtterances
    };

    const docRef = await addDoc(collection(db, 'repractice_sessions'), sessionData);
    return { id: docRef.id, ...sessionData } as RepracticeSession;
  }

  async getMistakesByUser(userId: string): Promise<Mistake[]> {
    if (isDemo) {
       return [
         {
           id: 'M001',
           userId,
           sessionId: 'S001',
           utteranceId: 1,
           scriptId: 'SC001',
           utteranceText: 'I have been practicing code.',
           spokenText: 'I am practicing code.',
           mistakeType: 'GRAMMAR',
           mistakeDetail: 'Used "am" instead of "have been"',
           practiceCount: 3,
           resolved: false,
           firstOccurrence: new Date().toISOString(),
           lastAttempt: new Date().toISOString()
         }
       ] as Mistake[];
    }

    const q = query(
      collection(db, 'mistakes'), 
      where('userId', '==', userId),
      orderBy('firstOccurrence', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mistake));
  }

  async recordRepracticeAttempt(mistakeId: string, analysis: VoiceAnalysis): Promise<boolean> {
    if (isDemo) return analysis.overallScore >= 80;

    const mistakeRef = doc(db, 'mistakes', mistakeId);
    const resolved = analysis.overallScore >= 80;

    const mSnap = await getDoc(mistakeRef);
    const currentData = mSnap.data();

    await updateDoc(mistakeRef, {
      practiceCount: (currentData?.practiceCount || 0) + 1,
      lastAttempt: serverTimestamp(),
      resolved: resolved,
      lastScore: analysis.overallScore
    });

    return resolved;
  }
}

export const repracticeService = new RepracticeService();
