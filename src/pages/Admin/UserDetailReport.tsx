import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Award, 
  PlayCircle, 
  Clock, 
  TrendingUp, 
  Save,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { DUMMY_USERS } from '@/data/dummy/user.dummy';
import { DUMMY_SESSIONS } from '@/data/dummy/session.dummy';

export default function UserDetailReport() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [adminNotes, setAdminNotes] = useState('');
  
  const user = DUMMY_USERS.find(u => u.id === userId) || DUMMY_USERS[1];

  const handleSaveNotes = () => {
    alert('Notes saved for the user. They will see these in their "Next Steps" section.');
  };

  return (
    <div className="space-y-8 pb-12">
      <button 
        onClick={() => navigate('/admin/reports')}
        className="flex items-center gap-2 text-gwf-muted hover:text-gwf-primary font-bold transition-all"
      >
        <ArrowLeft size={18} className="pointer-events-none" /> Back to Reports
      </button>

      {/* User Header */}
      <div className="bg-white p-8 rounded-[32px] border border-gwf-border shadow-md flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 rounded-full border-4 border-gwf-primary overflow-hidden shadow-lg">
          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
           <h2 className="text-3xl font-black italic text-gwf-text">{user.fullName}</h2>
           <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-gwf-muted italic">
              <span>{user.ageGroup}</span>
              <span>•</span>
              <span className="text-gwf-primary">Streak: {user.dailyStreakCount} Days</span>
              <span>•</span>
              <span className="text-gwf-accent">Avg Score: 82%</span>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="bg-gwf-bg p-4 rounded-2xl text-center min-w-[100px]">
              <p className="text-2xl font-black italic text-gwf-text">{user.totalSessionsPlayed}</p>
              <p className="text-[9px] font-black uppercase text-gwf-muted">Sessions</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Mistake Breakdown & Improvement */}
        <div className="lg:col-span-2 space-y-8">
          {/* Session History */}
          <div className="space-y-4">
            <h3 className="text-lg font-black italic text-gwf-text uppercase tracking-tight">Recent Sessions</h3>
            <div className="bg-white rounded-2xl border border-gwf-border shadow-sm overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-gwf-bg/50 border-b border-gwf-border">
                   <tr>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted">Date</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted">Script</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted">Score</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gwf-border">
                   {DUMMY_SESSIONS.slice(0, 5).map(session => (
                     <tr key={session.id} className="hover:bg-gwf-bg/20 transition-colors">
                       <td className="px-6 py-4 text-xs font-bold text-gwf-muted">
                         {new Date(session.createdDate?.seconds * 1000).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 font-bold text-sm">{session.sessionName}</td>
                       <td className="px-6 py-4">
                         <span className="font-black text-gwf-primary">{(Math.random() * 20 + 70).toFixed(0)}%</span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => navigate(`/session/report/${session.id}`)}
                           className="p-2 text-gwf-muted hover:text-gwf-primary hover:bg-gwf-primary/10 rounded-full transition-all"
                           title="View Session Report"
                         >
                           <ChevronRight size={16} className="pointer-events-none" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>

          {/* Improvement Trend */}
          <div className="space-y-4">
            <h3 className="text-lg font-black italic text-gwf-text uppercase tracking-tight">Weekly Progress Trend</h3>
            <div className="bg-white p-6 rounded-2xl border border-gwf-border shadow-sm">
               <div className="flex items-stretch h-52 gap-4 pt-10">
                  {(user.weeklyProgress || [65, 72, 68, 82]).map((score, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3">
                       <div className="w-full flex-1 bg-gwf-bg/50 rounded-t-2xl relative flex items-end">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${score}%` }}
                            className="w-full bg-gwf-accent rounded-t-lg relative"
                          >
                             <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-black text-gwf-accent whitespace-nowrap bg-white/80 px-1 rounded-md">
                               {score}%
                             </span>
                          </motion.div>
                       </div>
                       <span className="text-[10px] font-black uppercase text-gwf-muted tracking-widest italic shrink-0">Week {i + 1}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Weak Areas & Admin Notes */}
        <div className="space-y-8">
           <div className="space-y-4">
              <h3 className="text-lg font-black italic text-gwf-text uppercase tracking-tight">Main Weak Areas</h3>
              <div className="bg-white p-6 rounded-2xl border border-gwf-border shadow-sm space-y-6">
                 <ProgressItem label="Have Been (Perfect Tense)" value={65} color="bg-gwf-primary" />
                 <ProgressItem label="Phoneme: /θ/ (Th-sound)" value={42} color="bg-gwf-accent" />
                 <ProgressItem label="Speaking Speed (Fluency)" value={28} color="bg-gwf-warning" />
                 <ProgressItem label="Omitted Articles (a, an, the)" value={15} color="bg-gwf-error" />
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-lg font-black italic text-gwf-text uppercase tracking-tight">Admin Recommendations</h3>
              <div className="bg-gwf-primary p-6 rounded-3xl text-white space-y-4 shadow-xl">
                 <div className="flex items-center gap-2">
                    <MessageCircle size={20} className="italic" />
                    <span className="text-xs font-black uppercase tracking-[0.1em]">Mentor Notes</span>
                 </div>
                 <textarea 
                   rows={4}
                   value={adminNotes}
                   onChange={(e) => setAdminNotes(e.target.value)}
                   placeholder="Type focusing steps for this user..."
                   className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-sm font-medium placeholder:text-white/50 focus:bg-white/20 outline-none transition-all"
                 />
                 <button 
                   onClick={handleSaveNotes}
                   className="w-full py-3 bg-white text-gwf-primary rounded-xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-gwf-bg transition-colors"
                 >
                    <Save size={16} className="pointer-events-none" /> Update User Path
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ProgressItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase italic tracking-tight">
        <span className="text-gwf-text">{label}</span>
        <span className="text-gwf-muted">{value}% Frequency</span>
      </div>
      <div className="h-1.5 bg-gwf-bg rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
