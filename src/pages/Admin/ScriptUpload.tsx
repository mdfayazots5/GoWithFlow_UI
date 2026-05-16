import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Download,
  X,
  Plus,
  Eye,
  Save
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Script, Utterance } from '@/types';
import * as XLSX from 'xlsx';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DUMMY_SCRIPTS } from '@/data/dummy/script.dummy';

type Step = 1 | 2 | 3;

interface ValidationRow {
  row: number;
  errors: string[];
  data?: any;
}

export default function ScriptUpload() {
  const { isDemo } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [currentStep, setCurrentStep] = useState<Step>(isEdit ? 2 : 1);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; rows: ValidationRow[] } | null>(null);
  const [parsedUtterances, setParsedUtterances] = useState<Utterance[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [metadata, setMetadata] = useState({
    scriptTitle: '',
    category: 'Grammar Drill' as Script['category'],
    grammarFocusTag: 'Have Been',
    contextTag: 'Office',
    complexityLevel: 1 as Script['complexityLevel'],
    targetAgeGroup: 'All' as Script['targetAgeGroup'],
    hintLanguage: 'Telugu'
  });

  useEffect(() => {
    if (isEdit && id) {
      const fetchScript = async () => {
        setFetching(true);
        try {
          if (isDemo) {
            const script = DUMMY_SCRIPTS.find(s => s.id === id);
            if (script) {
              setMetadata({
                scriptTitle: script.title,
                category: script.category,
                grammarFocusTag: script.utterances[0]?.grammarTag || 'Have Been',
                contextTag: script.utterances[0]?.contextTag || 'Office',
                complexityLevel: script.complexityLevel,
                targetAgeGroup: script.targetAgeGroup,
                hintLanguage: script.utterances[0]?.hintText ? 'Telugu' : 'None'
              });
              setParsedUtterances(script.utterances);
              setValidationResult({ 
                valid: true, 
                rows: script.utterances.map((u, i) => ({ row: i + 1, errors: [], data: u }))
              });
            }
          } else {
            const docRef = doc(db, 'scripts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data() as Script;
              setMetadata({
                scriptTitle: data.title,
                category: data.category,
                grammarFocusTag: data.utterances[0]?.grammarTag || 'Have Been',
                contextTag: data.utterances[0]?.contextTag || 'Office',
                complexityLevel: data.complexityLevel,
                targetAgeGroup: data.targetAgeGroup,
                hintLanguage: 'Telugu'
              });
              setParsedUtterances(data.utterances);
              setValidationResult({ 
                valid: true, 
                rows: data.utterances.map((u, i) => ({ row: i + 1, errors: [], data: u }))
              });
            }
          }
        } catch (err) {
          console.error("Error fetching script:", err);
        } finally {
          setFetching(false);
        }
      };
      fetchScript();
    } else {
      setFetching(false);
    }
  }, [id, isEdit, isDemo]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet([
        { sequenceId: 1, speakerLabel: 'Person A', englishText: 'How long have you been waiting?', hintText: 'మీరు ఎంతకాలంగా వేచి ఉన్నారు?', grammarTag: 'Have Been', contextTag: 'General', focusWord: 'waiting', pronunciationNote: 'WAY-ting' },
        { sequenceId: 2, speakerLabel: 'Person B', englishText: 'I have been waiting for ten minutes.', hintText: 'నేను పది నిమిషాలుగా వేచి ఉన్నాను.', grammarTag: 'Have Been', contextTag: 'General', focusWord: 'minutes', pronunciationNote: 'MI-nits' },
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Script');
      XLSX.writeFile(workbook, 'GoWithFlow_Sample_Script.xlsx');
    } catch (err) {
      console.error('Error generating template:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setValidationResult(null);
      } else {
        alert('Please select a valid .xlsx file');
      }
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setLoading(true);
    setTimeout(() => {
      const demoUtterances: Utterance[] = [
        { sequenceId: 1, speakerLabel: 'Person A', englishText: 'Hello, how are you?', hintText: 'హలో, మీరు ఎలా ఉన్నారు?', grammarTag: 'Greeting', contextTag: 'General' },
        { sequenceId: 2, speakerLabel: 'Person B', englishText: 'I am doing well, thank you!', hintText: 'నేను బాగున్నాను, ధన్యవాదాలు!', grammarTag: 'Response', contextTag: 'General' },
        { sequenceId: 3, speakerLabel: 'Person A', englishText: 'Have you been busy lately?', hintText: 'మీరు ఇటీవల బిజీగా ఉన్నారా?', grammarTag: 'Perfect Tense', contextTag: 'Small Talk' },
      ];
      setValidationResult({ 
        valid: true, 
        rows: demoUtterances.map((u, i) => ({ row: i + 1, errors: [], data: u }))
      });
      setParsedUtterances(demoUtterances);
      setLoading(false);
      setCurrentStep(2);
    }, 1000);
  };

  const handleSave = async () => {
    if (!metadata.scriptTitle) return;
    setLoading(true);
    if (isEdit && id) {
      setTimeout(async () => {
        if (!isDemo) {
          try {
            await updateDoc(doc(db, 'scripts', id), {
              title: metadata.scriptTitle,
              category: metadata.category,
              complexityLevel: metadata.complexityLevel,
              targetAgeGroup: metadata.targetAgeGroup,
              updatedAt: new Date().toISOString()
            });
          } catch (err) {
            console.error('Error updating script:', err);
          }
        }
        setUploadProgress(100);
        setLoading(false);
        setCurrentStep(3);
      }, 1000);
    } else {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setLoading(false);
          setCurrentStep(3);
        }
      }, 100);
    }
  };

  const categories = ['Grammar Drill', 'Roleplay', 'Interview', 'Vocabulary', 'Fluency Drill', 'Repetition'];
  const grammarTags = ['Have Been', 'Has Been', 'Must Be', 'Should Be', 'Simple Past', 'Perfect Tense'];
  const ageGroups = ['All', 'Child (6-12)', 'Teen (13-17)', 'Adult (18+)'];

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto min-h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gwf-primary">
          <div className="w-12 h-12 border-4 border-gwf-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-black italic">Syncing Script Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/scripts')} className="p-2 hover:bg-gwf-bg rounded-full transition-all">
          <ArrowLeft size={24} />
        </button>
        <div className="space-y-1">
          <h2 className="text-2xl font-black italic text-gwf-text">{isEdit ? 'Edit Script' : 'Upload New Script'}</h2>
          <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest leading-none">
            {isEdit ? 'Refine scenarios and tags' : 'Excel-to-Library synchronization'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-12 relative">
        <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gwf-border -translate-y-1/2 z-0" />
        {[1, 2, 3].map((step) => (
          <div key={step} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all border-2 ${
              currentStep === step 
                ? 'bg-gwf-primary border-gwf-primary text-white scale-110 shadow-lg' 
                : currentStep > step 
                  ? 'bg-gwf-success border-gwf-success text-white' 
                  : 'bg-white border-gwf-border text-gwf-muted'
            }`}>
              {currentStep > step ? <CheckCircle2 size={20} /> : step}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              currentStep === step ? 'text-gwf-primary' : 'text-gwf-muted'
            }`}>
              {step === 1 ? 'Source' : step === 2 ? 'Details' : 'Registry'}
            </span>
          </div>
        ))}
      </div>

      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile?.name.endsWith('.xlsx')) setFile(droppedFile);
                }}
                className={`card-base p-16 border-dashed border-4 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all hover:bg-gwf-primary/5 group ${
                  file ? 'border-gwf-success bg-green-50/30' : 'border-gwf-border'
                }`}
              >
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${
                  file ? 'bg-gwf-success text-white' : 'bg-gwf-bg text-gwf-muted group-hover:scale-110'
                }`}>
                  <Upload size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black italic text-gwf-text">
                    {file ? file.name : 'Upload Script Excel'}
                  </h3>
                  <p className="text-sm font-bold text-gwf-muted mt-2">
                    {file ? `${(file.size / 1024).toFixed(1)} KB recognized` : 'Click or drag .xlsx file (Max 5MB)'}
                  </p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx" className="hidden" />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-sm font-black text-gwf-primary uppercase tracking-widest hover:bg-gwf-primary/5 px-4 py-2 rounded-xl transition-all">
                    <Download size={18} /> Download Sample Template
                 </button>
                 <button 
                  disabled={!file || loading}
                  onClick={handleValidate}
                  className="btn-primary h-14 px-12 italic text-lg shadow-xl disabled:opacity-50 transition-all flex items-center gap-3"
                 >
                    {loading ? 'Analyzing...' : 'Parse & Validate'} <ArrowRight size={20} />
                 </button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-gwf-success/10 border border-gwf-success/20 p-6 rounded-2xl flex items-center gap-4">
                 <div className="w-10 h-10 bg-gwf-success text-white rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} />
                 </div>
                 <div>
                    <h4 className="font-black text-gwf-success italic">Data Synchronized!</h4>
                    <p className="text-xs font-bold text-gwf-success/80">{parsedUtterances.length} utterances extracted from source.</p>
                 </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black italic text-gwf-text">Utterance Summary</h3>
                <div className="bg-white border border-gwf-border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gwf-bg/50 border-b border-gwf-border font-black text-gwf-muted uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-3">Sequence</th>
                          <th className="px-4 py-3">Speaker</th>
                          <th className="px-4 py-3">English Utterance</th>
                          <th className="px-4 py-3">Hint</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gwf-border">
                        {parsedUtterances.map((u) => (
                          <tr key={u.sequenceId}>
                            <td className="px-4 py-3 font-black text-gwf-primary italic">{u.sequenceId}</td>
                            <td className="px-4 py-3 font-bold">{u.speakerLabel}</td>
                            <td className="px-4 py-3 font-medium">{u.englishText}</td>
                            <td className="px-4 py-3 text-gwf-muted italic">{u.hintText}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>

              <div className="space-y-6 bg-white p-8 rounded-3xl border border-gwf-border shadow-md">
                 <h3 className="text-lg font-black italic text-gwf-text border-b border-gwf-border pb-4 uppercase tracking-tighter">Script Registry Info</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">Title</label>
                       <input 
                        type="text" 
                        value={metadata.scriptTitle}
                        onChange={(e) => setMetadata({...metadata, scriptTitle: e.target.value})}
                        className="w-full bg-gwf-bg border border-gwf-border rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-gwf-primary"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">Category</label>
                       <select 
                        value={metadata.category}
                        onChange={(e) => setMetadata({...metadata, category: e.target.value as any})}
                        className="w-full bg-gwf-bg border border-gwf-border rounded-xl p-4 text-sm font-bold outline-none"
                       >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">Grammar Focus</label>
                       <select 
                        value={metadata.grammarFocusTag}
                        onChange={(e) => setMetadata({...metadata, grammarFocusTag: e.target.value})}
                        className="w-full bg-gwf-bg border border-gwf-border rounded-xl p-4 text-sm font-bold outline-none"
                       >
                          {grammarTags.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">Target Age Group</label>
                       <select 
                        value={metadata.targetAgeGroup}
                        onChange={(e) => setMetadata({...metadata, targetAgeGroup: e.target.value as any})}
                        className="w-full bg-gwf-bg border border-gwf-border rounded-xl p-4 text-sm font-bold outline-none"
                       >
                          {ageGroups.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="flex justify-between items-center pt-8">
                 <button onClick={() => setCurrentStep(1)} className="font-bold text-gwf-muted hover:text-gwf-primary flex items-center gap-2 uppercase tracking-widest text-[10px]">
                    <ArrowLeft size={16} /> Previous Step
                 </button>
                 <button onClick={handleSave} disabled={!metadata.scriptTitle || loading} className="btn-primary h-14 px-12 italic text-lg shadow-xl flex items-center gap-3">
                    {isEdit ? 'Commit Changes' : 'Confirm & Save'} {isEdit ? <Save size={20} /> : <ArrowRight size={20} />}
                 </button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center space-y-8 text-center pt-12"
            >
              <div className="w-24 h-24 bg-gwf-success text-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                 <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic text-gwf-text uppercase tracking-tight">Sync Complete!</h2>
                <p className="text-lg font-bold text-gwf-muted italic">"{metadata.scriptTitle}" has been updated in the registry.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                 <button onClick={() => navigate('/admin/scripts')} className="card-base p-6 border-gwf-primary flex flex-col items-center gap-2 hover:bg-gwf-primary/5">
                    <Eye className="text-gwf-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gwf-primary">View Library</span>
                 </button>
                 <button onClick={() => isEdit ? navigate('/admin/dashboard') : setCurrentStep(1)} className="card-base p-6 border-gwf-accent flex flex-col items-center gap-2 hover:bg-gwf-accent/5">
                    <ArrowLeft className="text-gwf-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gwf-accent">Dashboard</span>
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center">
           <div className="bg-white p-12 rounded-[40px] w-full max-w-md space-y-8 text-center shadow-2xl">
              <div className="space-y-4">
                 <h3 className="text-2xl font-black italic text-gwf-text uppercase">Registry Sync</h3>
                 <div className="h-4 bg-gwf-bg rounded-full overflow-hidden border border-gwf-border">
                    <motion.div 
                      className="h-full bg-gwf-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                 </div>
                 <span className="text-xl font-black italic text-gwf-primary">{uploadProgress}%</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
