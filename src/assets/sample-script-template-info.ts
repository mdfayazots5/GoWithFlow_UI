/**
 * GoWithFlow Sample Script Template Documentation
 * 
 * This file defines the structure for Excel-based script uploads.
 * Admin uses this to generate the downloadable template.
 */

export const SAMPLE_SCRIPT_COLUMNS = [
  { id: 'A', name: 'sequenceId', type: 'number', required: true, description: 'Order of dialogue (1, 2, 3...)' },
  { id: 'B', name: 'speakerLabel', type: 'text', required: true, description: 'Role name (e.g., "Person A", "Interviewer")' },
  { id: 'C', name: 'englishText', type: 'text', required: true, description: 'The English sentence to speak' },
  { id: 'D', name: 'hintText', type: 'text', required: false, description: 'Native language translation/clue' },
  { id: 'E', name: 'grammarTag', type: 'text', required: false, description: 'Specific grammar point (e.g., "Present Perfect")' },
  { id: 'F', name: 'contextTag', type: 'text', required: false, description: 'Scenario context (e.g., "Business Meeting")' },
  { id: 'G', name: 'focusWord', type: 'text', required: false, description: 'Key word to emphasize' },
  { id: 'H', name: 'pronunciationNote', type: 'text', required: false, description: 'Phonetic phonetic hint (e.g., "pro-NOUNCE")' },
];

export const TEMPLATE_INSTRUCTIONS = [
  'Ensure each speaker label is consistent across the script.',
  'Maximum 50 utterances per script for optimal sync performance.',
  'Save as .xlsx or .csv before uploading via the Admin Dashboard.',
  'The first row must contain these headers exactly as defined.'
];
