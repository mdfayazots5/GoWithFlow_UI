import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit2, Zap, Play, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Script } from '@/types';
import { DUMMY_SCRIPTS } from '@/data/dummy/script.dummy';
import { toastService } from '@/lib/toastService';

export default function ScriptManagement() {
  const { isDemo } = useAuth();
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchScripts();
  }, [isDemo]);

  const fetchScripts = async () => {
    try {
      if (isDemo) {
        setScripts(DUMMY_SCRIPTS);
        return;
      }
      const q = query(collection(db, 'scripts'), orderBy('uploadedDate', 'desc'));
      const snap = await getDocs(q);
      setScripts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Script)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this script? This action cannot be undone.')) return;
    
    try {
      if (!isDemo) {
        await deleteDoc(doc(db, 'scripts', id));
      }
      setScripts(prev => prev.filter(s => s.id !== id));
      toastService.success('Script deleted successfully');
    } catch (error) {
      console.error('Error deleting script:', error);
      toastService.error('Failed to delete script. Please try again.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-3xl font-black italic text-gwf-text tracking-tight uppercase">Script Management</h2>
          <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest">Library stats: {scripts.length} Total • {scripts.filter(s => s.active).length} Active</p>
        </div>
        <button 
          onClick={() => navigate('/admin/scripts/upload')}
          className="btn-primary h-[56px] px-8 flex items-center gap-3 italic font-black shadow-xl"
        >
          <Plus size={24} className="pointer-events-none" /> Upload New Script
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-gwf-border shadow-sm">
            <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest mb-1">Total Scenarios</p>
            <p className="text-2xl font-black italic text-gwf-primary">{scripts.length}</p>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gwf-border shadow-sm">
            <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest mb-1">Active Scripts</p>
            <p className="text-2xl font-black italic text-gwf-accent">{scripts.filter(s => s.active).length}</p>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gwf-border shadow-sm">
            <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest mb-1">Total Utterances</p>
            <p className="text-2xl font-black italic text-gwf-success">{scripts.reduce((acc, s) => acc + s.utteranceCount, 0)}</p>
         </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gwf-border shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gwf-bg/50 border-b border-gwf-border uppercase text-[10px] font-black tracking-widest text-gwf-muted">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Script Title</th>
                <th className="px-6 py-4 whitespace-nowrap">Category</th>
                <th className="px-6 py-4 whitespace-nowrap">Focus</th>
                <th className="px-6 py-4 whitespace-nowrap">Lines</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gwf-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gwf-primary mx-auto"></div>
                  </td>
                </tr>
              ) : scripts.map((script) => (
                <tr key={script.id} className="hover:bg-gwf-bg/20 transition-colors group">
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => navigate(`/admin/scripts/edit/${script.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gwf-bg flex items-center justify-center text-gwf-primary">
                        <FileText size={18} />
                      </div>
                      <span className="font-bold text-sm text-gwf-text group-hover:text-gwf-primary transition-colors">{script.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-gwf-bg px-2 py-1 rounded-md border border-gwf-border uppercase whitespace-nowrap">
                      {script.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[10px] text-gwf-muted italic uppercase whitespace-nowrap">
                    {script.grammarFocusTag}
                  </td>
                  <td className="px-6 py-4 font-black italic text-sm text-gwf-primary">{script.utteranceCount}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                      script.active ? 'bg-green-100 text-green-700' : 'bg-gwf-muted/10 text-gwf-muted'
                    }`}>
                      {script.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/scripts/edit/${script.id}`);
                        }}
                        className="p-2 hover:bg-gwf-primary/10 rounded-lg text-gwf-primary transition-all active:scale-90"
                        title="Edit Script"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Attempting delete for script:', script.id);
                          handleDelete(script.id);
                        }} 
                        className="p-2 hover:bg-gwf-error/10 rounded-lg text-gwf-error transition-all active:scale-90"
                        title="Delete Script"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {scripts.length === 0 && !loading && (
          <div className="p-12 text-center space-y-4">
             <p className="text-gwf-muted italic">The library is currently empty.</p>
             <button onClick={() => navigate('/admin/scripts/upload')} className="btn-primary px-6 h-10 text-xs">Upload First Script</button>
          </div>
        )}
      </div>
    </div>
  );
}
