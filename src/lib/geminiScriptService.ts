import { ai, MODELS } from './gemini';
import { Type } from '@google/genai';
import { Utterance } from '@/types';

export const generateScript = async (params: {
  topic: string,
  grammarTag: string,
  numMembers: number,
  numLines: number,
  context: string
}): Promise<Utterance[]> => {
  const prompt = `
    Generate a dialogue script for English language practice.
    Topic: ${params.topic}
    Grammar Focus: ${params.grammarTag}
    Context: ${params.context}
    Number of speakers: ${params.numMembers}
    Total lines: ${params.numLines}
    
    The script should be a natural conversation. 
    Each line must include:
    1. speakerName: the name of the speaker (Person 1, Person 2, etc.)
    2. englishText: the sentence in English.
    3. teluguHint: a natural Telugu translation for meaning.
    4. sequenceId: starting from 1.
    5. grammarTag: ${params.grammarTag}
    6. contextTag: ${params.context}
    
    Ensure the grammar focus "${params.grammarTag}" is used frequently and correctly.
  `.trim();

  const response = await ai.models.generateContent({
    model: MODELS.FLASH,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sequenceId: { type: Type.INTEGER },
            speakerName: { type: Type.STRING },
            englishText: { type: Type.STRING },
            teluguHint: { type: Type.STRING },
            grammarTag: { type: Type.STRING },
            contextTag: { type: Type.STRING },
          },
          required: ["sequenceId", "speakerName", "englishText", "teluguHint", "grammarTag", "contextTag"]
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const generateSessionSummary = async (stats: any, sessionName: string): Promise<string> => {
  const prompt = `
    Provide a short, encouraging summary for a language practice session.
    Session Name: ${sessionName}
    Performance Stats:
    - Fluency: ${stats.fluency}%
    - Confidence: ${stats.confidence}%
    - Grammar: ${stats.grammar}%
    
    Write 2-3 sentences max. Focus on family collaboration and growth.
  `.trim();

  const response = await ai.models.generateContent({
    model: MODELS.FLASH,
    contents: prompt
  });

  return response.text || "Keep up the great work! Your family practice sessions are showing real progress in English naturalness.";
};

export const evaluatePracticeUtterance = async (params: {
  expectedText: string,
  transcript: string,
  mistakeDetail: string
}): Promise<{ score: number; text: string; phoneticHelp?: string }> => {
  const prompt = `
    Evaluate a student's attempt to correct a specific English mistake.
    
    Original Mistake Detail: ${params.mistakeDetail}
    Target Sentence: "${params.expectedText}"
    Student Said: "${params.transcript}"
    
    Rate the attempt out of 100 on accuracy and fluency.
    If they fixed the mistake correctly, score should be 100.
    Provide a short encouraging feedback text.
    If pronunciation was the issue, provide a simple phonetic help (e.g. "Say it like: REE-al-tee").
  `.trim();

  const response = await ai.models.generateContent({
    model: MODELS.FLASH,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          text: { type: Type.STRING },
          phoneticHelp: { type: Type.STRING }
        },
        required: ["score", "text"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (err) {
    return { score: 70, text: "Good attempt! Listen to the correct text again." };
  }
};
