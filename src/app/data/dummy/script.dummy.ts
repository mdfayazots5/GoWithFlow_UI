// File: src/app/data/dummy/script.dummy.ts
import { Script } from '@core/models/script.model';

export const DUMMY_SCRIPTS: Script[] = [
  {
    id: 'SC001',
    scriptTitle: 'Office Conversation — Have Been',
    category: 'Grammar Drill',
    grammarFocusTag: 'Have Been',
    contextTag: 'Office',
    complexityLevel: 3,
    targetAgeGroup: 'Adult (18+)',
    hintLanguage: 'Telugu',
    active: true,
    uploadedDate: '2024-05-01',
    uploadedBy: 'Admin',
    version: 1,
    utteranceCount: 4,
    utterances: [
      {
        sequenceId: 1,
        speakerLabel: 'Project Manager',
        englishText: 'I have been waiting for your report since morning.',
        hintText: 'నేను ఉదయం నుండి మీ రిపోర్ట్ కోసం ఎదురుచూస్తున్నాను.',
        grammarTag: 'Present Perfect Continuous',
        contextTag: 'Office',
        focusWord: 'have been waiting'
      },
      {
        sequenceId: 2,
        speakerLabel: 'Developer',
        englishText: 'I am sorry, I have been working on the bug fix.',
        hintText: 'నన్ను క్షమించండి, నేను బగ్ ఫిక్స్ మీద పని చేస్తున్నాను.',
        grammarTag: 'Present Perfect Continuous',
        contextTag: 'Office',
        focusWord: 'have been working'
      },
      {
        sequenceId: 3,
        speakerLabel: 'Project Manager',
        englishText: 'Has the client been informed about the delay?',
        hintText: 'ఆలస్యం గురించి క్లయింట్‌కు సమాచారం అందించారా?',
        grammarTag: 'Present Perfect Continuous',
        contextTag: 'Office',
        focusWord: 'has been informed'
      },
      {
        sequenceId: 4,
        speakerLabel: 'Developer',
        englishText: 'Yes, they have been very understanding about it.',
        hintText: 'అవును, వారు దాని గురించి చాలా అర్థం చేసుకుంటున్నారు.',
        grammarTag: 'Present Perfect',
        contextTag: 'Office',
        focusWord: 'have been'
      }
    ]
  },
  {
    id: 'SC002',
    scriptTitle: 'Mock Interview — OOP Concepts',
    category: 'Interview',
    grammarFocusTag: 'None',
    contextTag: 'Interview',
    complexityLevel: 4,
    targetAgeGroup: 'Adult (18+)',
    hintLanguage: 'Telugu',
    active: true,
    uploadedDate: '2024-05-10',
    uploadedBy: 'Admin',
    version: 1,
    utteranceCount: 5,
    utterances: [
      {
        sequenceId: 1,
        speakerLabel: 'Interviewer',
        englishText: 'Can you explain the four pillars of Object-Oriented Programming?',
        hintText: 'ఆబ్జెక్ట్-ఓరియెంటెడ్ ప్రోగ్రామింగ్ యొక్క నాలుగు స్తంభాలను మీరు వివరించగలరా?',
        grammarTag: 'Modal Verbs',
        contextTag: 'Interview',
        focusWord: 'pillars'
      },
      {
        sequenceId: 2,
        speakerLabel: 'Candidate',
        englishText: 'Sure, they are Encapsulation, Abstraction, Inheritance, and Polymorphism.',
        hintText: 'తప్పకుండా, అవి ఎన్‌కాప్సులేషన్, అబ్స్ట్రాక్షన్, ఇన్హెరిటెన్స్ మరియు పాలిమార్ఫిజం.',
        grammarTag: 'Basic Sentence',
        contextTag: 'Interview'
      },
      {
        sequenceId: 3,
        speakerLabel: 'Interviewer',
        englishText: 'How would you differentiate between Abstraction and Encapsulation?',
        hintText: 'అబ్స్ట్రాక్షన్ మరియు ఎన్‌కాప్సులేషన్ మధ్య మీరు ఎలా తేడా చూపిస్తారు?',
        grammarTag: 'Conditional',
        contextTag: 'Interview'
      },
      {
        sequenceId: 4,
        speakerLabel: 'Candidate',
        englishText: 'Abstraction hides complexity while Encapsulation hides data.',
        hintText: 'అబ్స్ట్రాక్షన్ సంక్లిష్టతను దాచిపెడుతుంది, ఎన్‌కాప్సులేషన్ డేటాను దాచిపెడుతుంది.',
        grammarTag: 'Present Simple',
        contextTag: 'Interview'
      },
      {
        sequenceId: 5,
        speakerLabel: 'Interviewer',
        englishText: 'Good. Can you give a real-world example of Polymorphism?',
        hintText: 'మంచిది. పాలిమార్ఫిజానికి నిజ జీవిత ఉదాహరణ ఇవ్వగలరా?',
        grammarTag: 'Modal Verbs',
        contextTag: 'Interview'
      }
    ]
  },
  {
    id: 'SC003',
    scriptTitle: 'Family Kitchen Roleplay',
    category: 'Roleplay',
    grammarFocusTag: 'Must Be',
    contextTag: 'Kitchen',
    complexityLevel: 2,
    targetAgeGroup: 'All',
    hintLanguage: 'Telugu',
    active: true,
    uploadedDate: '2024-05-15',
    uploadedBy: 'Admin',
    version: 1,
    utteranceCount: 6,
    utterances: [
      {
        sequenceId: 1,
        speakerLabel: 'Mom',
        englishText: 'The dinner must be ready in ten minutes.',
        hintText: 'పది నిమిషాలలో డిన్నర్ సిద్ధంగా ఉండాలి.',
        grammarTag: 'Must Be',
        contextTag: 'Kitchen'
      },
      {
        sequenceId: 2,
        speakerLabel: 'Son',
        englishText: 'I am so hungry, I must be dreaming of pizza!',
        hintText: 'నాకు చాలా ఆకలిగా ఉంది, నేను పిజ్జా గురించి కలలు కంటున్నానేమో!',
        grammarTag: 'Must Be',
        contextTag: 'Kitchen'
      },
      {
        sequenceId: 3,
        speakerLabel: 'Mom',
        englishText: 'Help me set the table, please.',
        hintText: 'దయచేసి టేబుల్ సర్దడంలో నాకు సహాయం చేయండి.',
        grammarTag: 'Imperative',
        contextTag: 'Kitchen'
      },
      {
        sequenceId: 4,
        speakerLabel: 'Daughter',
        englishText: 'Where are the plates? They must be in this cupboard.',
        hintText: 'ప్లేట్లు ఎక్కడ ఉన్నాయి? అవి ఈ కబోర్డ్‌లో ఉండాలి.',
        grammarTag: 'Must Be',
        contextTag: 'Kitchen'
      }
    ]
  }
];
