import { Script } from '@/types';

export const DUMMY_SCRIPTS: Script[] = [
  {
    id: 'SC001',
    title: 'Office Conversation — Have Been / Has Been',
    description: 'A professional office scenario focusing on the present perfect continuous tense.',
    category: 'Grammar Drill',
    grammarFocusTag: 'Have Been',
    contextTag: 'Office',
    complexityLevel: 2,
    targetAgeGroup: 'Adult (18+)',
    hintLanguage: 'Telugu',
    active: true,
    uploadedDate: new Date().toISOString(),
    uploadedBy: 'U000',
    version: 1,
    estDuration: 5,
    utteranceCount: 4,
    utterances: [
      {
        sequenceId: 1,
        speakerLabel: 'Person A',
        englishText: 'How long have you been working here?',
        hintText: 'మీరు ఇక్కడ ఎంతకాలంగా పని చేస్తున్నారు?',
        grammarTag: 'Present Perfect Continuous',
        contextTag: 'Greeting'
      },
      {
        sequenceId: 2,
        speakerLabel: 'Person B',
        englishText: 'I have been working here for five years.',
        hintText: 'నేను ఇక్కడ ఐదేళ్లుగా పని చేస్తున్నాను.',
        grammarTag: 'Present Perfect Continuous',
        contextTag: 'Response'
      },
      {
        sequenceId: 3,
        speakerLabel: 'Person A',
        englishText: 'Has the manager been in his office all day?',
        hintText: 'మేనేజర్ రోజంతా తన ఆఫీసులో ఉన్నారా?',
        grammarTag: 'Present Perfect Continuous',
        contextTag: 'Inquiry'
      },
      {
        sequenceId: 4,
        speakerLabel: 'Person B',
        englishText: 'Yes, he has been busy with meetings.',
        hintText: 'అవును, ఆయన మీటింగ్స్ తో బిజీగా ఉన్నారు.',
        grammarTag: 'Present Perfect Continuous',
        contextTag: 'Confirmation'
      }
    ]
  },
  {
    id: 'SC002',
    title: 'Mock Interview — OOP Concepts',
    description: 'Technical interview practice for software engineering roles focusing on core OOP principles.',
    category: 'Interview',
    grammarFocusTag: 'Advanced Grammar',
    contextTag: 'Interview',
    complexityLevel: 4,
    targetAgeGroup: 'Adult (18+)',
    hintLanguage: 'Telugu',
    active: true,
    uploadedDate: new Date().toISOString(),
    uploadedBy: 'U000',
    version: 1,
    estDuration: 10,
    utteranceCount: 3,
    utterances: [
      {
        sequenceId: 1,
        speakerLabel: 'Interviewer',
        englishText: 'Can you explain the four pillars of OOPs?',
        hintText: 'మీరు OOPs యొక్క నాలుగు ముఖ్యమైన విషయాల గురించి చెప్పగలరా?',
        grammarTag: 'Inquiry',
        contextTag: 'Question'
      },
      {
        sequenceId: 2,
        speakerLabel: 'Candidate',
        englishText: 'The four pillars are Encapsulation, Abstraction, Inheritance, and Polymorphism.',
        hintText: 'ఆ నాలుగు ఎన్క్యాప్సులేషన్, అబ్‌స్ట్రాక్షన్, ఇన్హెరిటెన్స్ మరియు పాలిమార్ఫిజం.',
        grammarTag: 'Listing',
        contextTag: 'Answer'
      },
      {
        sequenceId: 3,
        speakerLabel: 'Interviewer',
        englishText: 'That represents a solid understanding.',
        hintText: 'అది మంచి అవగాహనను సూచిస్తుంది.',
        grammarTag: 'Feedback',
        contextTag: 'Evaluation'
      }
    ]
  },
  {
    id: 'SC003',
    title: 'Family Kitchen Roleplay',
    description: 'A warm household scenario for practicing polite requests and helpful cooperation.',
    category: 'Roleplay',
    grammarFocusTag: 'Daily Conversations',
    contextTag: 'Kitchen',
    complexityLevel: 1,
    targetAgeGroup: 'All',
    hintLanguage: 'Telugu',
    active: true,
    uploadedDate: new Date().toISOString(),
    uploadedBy: 'U000',
    version: 1,
    estDuration: 3,
    utteranceCount: 3,
    utterances: [
      {
        sequenceId: 1,
        speakerLabel: 'Mother',
        englishText: 'Could you please help me wash the vegetables?',
        hintText: 'దయచేసి కూరగాయలు కడగడంలో నాకు సహాయం చేస్తావా?',
        grammarTag: 'Polite Request',
        contextTag: 'Cooking'
      },
      {
        sequenceId: 2,
        speakerLabel: 'Son',
        englishText: 'Sure mom, I will do it right away.',
        hintText: 'తప్పకుండా అమ్మ, నేను ఇప్పుడే చేస్తాను.',
        grammarTag: 'Confirmation',
        contextTag: 'Response'
      },
      {
        sequenceId: 3,
        speakerLabel: 'Mother',
        englishText: 'Thank you, that would be very helpful.',
        hintText: 'ధన్యవాదాలు, అది చాలా సహాయకరంగా ఉంటుంది.',
        grammarTag: 'Gratitude',
        contextTag: 'Acknowledgement'
      }
    ]
  }
];
