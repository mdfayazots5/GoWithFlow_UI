import * as XLSX from 'xlsx';
import { Utterance } from '@/types';

export interface ExcelScriptData {
  title: string;
  category: string;
  grammarFocus: string;
  context: string;
  complexity: number;
  targetAgeGroup: string;
  hintLanguage: string;
  utterances: Utterance[];
}

export async function parseScriptExcel(file: File): Promise<Utterance[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Skip header row and map columns
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Expected columns:
        // A: sequenceId, B: speakerLabel, C: englishText, D: hintText, E: grammarTag, F: contextTag, G: focusWord, H: pronunciationNote
        const utterances: Utterance[] = jsonData.slice(1).map((row) => ({
          sequenceId: Number(row[0]) || 0,
          speakerLabel: String(row[1] || ''),
          englishText: String(row[2] || ''),
          hintText: String(row[3] || ''),
          grammarTag: String(row[4] || ''),
          contextTag: String(row[5] || ''),
          focusWord: row[6] ? String(row[6]) : undefined,
          pronunciationNote: row[7] ? String(row[7]) : undefined,
        })).filter(u => u.englishText.trim() !== '');

        resolve(utterances);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['sequenceId', 'speakerLabel', 'englishText', 'hintText', 'grammarTag', 'contextTag', 'focusWord', 'pronunciationNote'],
    [1, 'Person A', 'Hello, how have you been?', 'నమస్కారం, మీరు ఎలా ఉన్నారు?', 'Have Been', 'Social', 'been', 'pronounce: been'],
    [2, 'Person B', 'I have been very busy lately.', 'నేను ఇటీవల చాలా బిజీగా ఉన్నాను.', 'Have Been', 'Social', 'lately', '']
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ScriptTemplate');
  XLSX.writeFile(wb, 'GoWithFlow_Script_Template.xlsx');
}
