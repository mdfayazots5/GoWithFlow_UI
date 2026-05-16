import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Users, 
  Clock, 
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { DUMMY_SESSIONS } from '@/data/dummy/session.dummy';
import { useAuth } from '@/lib/AuthContext';

export default function SessionManagement() {
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      if (isDemo) {
        setSessions(DUMMY_SESSIONS);
        setFilteredSessions(DUMMY_SESSIONS);
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'sessions'), orderBy('createdDate', 'desc'), limit(50));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
        
        let finalData = data;
        // Use dummy data if no real data exists (for testing/demo)
        if (data.length === 0) {
          finalData = DUMMY_SESSIONS;
        }
        setSessions(finalData);
        setFilteredSessions(finalData);
      } catch (err) {
        console.error(err);
        setSessions(DUMMY_SESSIONS); // Fallback to dummy data on error
        setFilteredSessions(DUMMY_SESSIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    const results = sessions.filter(s => 
      s.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.scriptId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSessions(results);
  }, [searchTerm, sessions]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black italic text-gwf-text tracking-tight uppercase">Session Management</h1>
          <p className="text-gwf-muted italic">Monitor active and historic learning sessions across the platform.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/admin/sessions/create')}
            className="btn-primary h-10 px-6 rounded-xl text-xs font-black uppercase italic shadow-lg shadow-gwf-primary/20 flex items-center gap-2"
          >
            Create Session <PlayCircle size={18} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gwf-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search session or script..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-gwf-border rounded-xl pl-10 pr-4 py-2 text-sm focus:border-gwf-primary outline-none transition-all w-64"
            />
          </div>
          <button className="p-2 bg-white border border-gwf-border rounded-xl text-gwf-muted hover:text-gwf-primary transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gwf-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gwf-bg/50 border-b border-gwf-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Session / Script</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Mode</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Host / Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gwf-border">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 bg-gwf-bg/10"></td>
                  </tr>
                ))
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gwf-muted italic">
                    {searchTerm ? `No sessions found matching "${searchTerm}"` : 'No sessions found in the system.'}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gwf-bg/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gwf-text truncate max-w-[200px]">{session.sessionName}</div>
                      <div className="text-[10px] text-gwf-muted uppercase font-black">{session.scriptId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gwf-muted uppercase">
                      {session.sessionMode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${['ACTIVE', 'IN_PROGRESS'].includes(session.status) ? 'bg-green-500' : 'bg-gwf-muted'}`} />
                        <span className="text-sm font-bold text-gwf-text uppercase">{session.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gwf-muted">
                      {session.createdDate ? (
                        format(
                          session.createdDate.seconds 
                            ? new Date(session.createdDate.seconds * 1000) 
                            : new Date(session.createdDate), 
                          'MMM d, h:mm a'
                        )
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/session/report/${session.id}`)}
                        className="bg-gwf-primary/5 hover:bg-gwf-primary/10 text-gwf-primary px-4 py-2 rounded-xl font-black italic text-xs uppercase flex items-center gap-1 ml-auto transition-all"
                      >
                        Details <ArrowRight size={14} className="pointer-events-none" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
