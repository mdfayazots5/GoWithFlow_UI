import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { VoiceAnalysis, Mistake, Assessment } from '@/types';
import { isDemo } from './demoService';

class AssessmentService {
  /**
   * Save a voice analysis result and handle mistake logic
   */
  async saveEvaluation(analysis: VoiceAnalysis, scriptId: string, grammarTag?: string, contextTag?: string) {
    if (isDemo || analysis.sessionId === 'S005') {
      console.log('[ASSESSMENT-DEMO] Saving evaluation:', analysis);
      return 'DEMO-ASSESSMENT-ID';
    }

    try {
      // 1. Map to Assessment structure for reports
      const assessmentData = {
        sessionId: analysis.sessionId,
        candidateMemberId: analysis.userId,
        utteranceIndex: analysis.utteranceId,
        transcript: analysis.transcribedText,
        scriptId,
        grammarTag,
        contextTag,
        ratings: {
          fluency: analysis.fluencyScore / 20, // 0-5 scale for reports
          confidence: analysis.confidenceScore / 20,
          accuracy: analysis.overallScore / 20,
          grammar: analysis.grammarErrors.length === 0 ? 5 : Math.max(1, 5 - analysis.grammarErrors.length),
          pronunciationScore: analysis.overallScore / 20,
          clarity: analysis.confidenceScore / 20
        },
        ...analysis,
        timestamp: serverTimestamp()
      };

      // 2. Save Assessment record
      const assessmentRef = await addDoc(collection(db, 'assessments'), assessmentData);

      // 2. Mistake Logic
      // Threshold: score < 80 -> save as Mistake record
      if (analysis.overallScore < 80) {
        await this.recordMistake(analysis, scriptId, grammarTag, contextTag);
      } else {
        await this.resolveMistakeIfPresent(analysis.userId, analysis.utteranceId, scriptId);
      }

      return assessmentRef.id;
    } catch (error) {
      console.error('Error saving evaluation:', error);
      throw error;
    }
  }

  private async recordMistake(analysis: VoiceAnalysis, scriptId: string, grammarTag?: string, contextTag?: string) {
    const mistakeType = this.determineMistakeType(analysis);
    
    // Check if mistake already exists for this utterance/user
    const q = query(
      collection(db, 'mistakes'),
      where('userId', '==', analysis.userId),
      where('utteranceId', '==', analysis.utteranceId),
      where('scriptId', '==', scriptId),
      where('resolved', '==', false)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      // Update existing mistake
      const mistakeDoc = snap.docs[0];
      await updateDoc(doc(db, 'mistakes', mistakeDoc.id), {
        practiceCount: (mistakeDoc.data().practiceCount || 0) + 1,
        lastAttempt: new Date().toISOString(),
        spokenText: analysis.transcribedText
      });
    } else {
      // Create new mistake
      const mistakeData: Partial<Mistake> = {
        userId: analysis.userId,
        sessionId: analysis.sessionId,
        utteranceId: analysis.utteranceId,
        scriptId,
        utteranceText: analysis.expectedText,
        spokenText: analysis.transcribedText,
        mistakeType,
        mistakeDetail: this.generateMistakeDetail(analysis, mistakeType),
        grammarTag,
        contextTag,
        practiceCount: 1,
        resolved: false,
        firstOccurrence: new Date().toISOString(),
        lastAttempt: new Date().toISOString()
      };
      await addDoc(collection(db, 'mistakes'), mistakeData);
    }
  }

  private async resolveMistakeIfPresent(userId: string, utteranceId: number, scriptId: string) {
    // Mistake auto-resolve threshold: score > 80 for 2 consecutive attempts
    // For now, simpler: resolve if current score > 80 and was previously recorded as mistake
    const q = query(
      collection(db, 'mistakes'),
      where('userId', '==', userId),
      where('utteranceId', '==', utteranceId),
      where('scriptId', '==', scriptId),
      where('resolved', '==', false)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      for (const mDoc of snap.docs) {
        // In a more complex version, we'd check previous scores
        // Here we just resolve it
        await updateDoc(doc(db, 'mistakes', mDoc.id), {
          resolved: true,
          resolvedAt: new Date().toISOString()
        });
      }
    }
  }

  private determineMistakeType(analysis: VoiceAnalysis): Mistake['mistakeType'] {
    if (analysis.hesitationWords.length > 2) return 'HESITATION';
    if (analysis.grammarErrors.length > 0) return 'GRAMMAR';
    if (analysis.speakingSpeedWPM < 60) return 'SPEED';
    if (analysis.transcribedText.split(' ').length < analysis.expectedText.split(' ').length * 0.5) return 'INCOMPLETE';
    return 'PRONUNCIATION';
  }

  private generateMistakeDetail(analysis: VoiceAnalysis, type: Mistake['mistakeType']): string {
    switch (type) {
      case 'HESITATION': return `Used fillers: ${analysis.hesitationWords.join(', ')}`;
      case 'GRAMMAR': return `Missing or incorrect words: ${analysis.grammarErrors.map(e => e.expectedPhrase).join(', ')}`;
      case 'SPEED': return `Speaking too slowly: ${analysis.speakingSpeedWPM} WPM`;
      case 'INCOMPLETE': return 'Sentence was incomplete or skipped';
      default: return 'Needs clearer pronunciation';
    }
  }

  async getSessionReport(sessionId: string) {
    const q = query(collection(db, 'assessments'), where('sessionId', '==', sessionId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

export const assessmentService = new AssessmentService();
