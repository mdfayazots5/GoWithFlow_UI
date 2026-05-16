import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Sync Complete',
    message: 'Your Grammar Drill session was saved successfully.',
    time: '2 mins ago',
    type: 'success',
    read: false
  },
  {
    id: '2',
    title: 'New Mistake Detected',
    message: 'You have a new "Have Been" usage mistake to practice.',
    time: '1 hour ago',
    type: 'warning',
    read: false
  },
  {
    id: '3',
    title: 'Weekly Goal Reached',
    message: 'You completed all 5 sessions this week. Great job!',
    time: '5 hours ago',
    type: 'info',
    read: true
  },
  {
    id: '4',
    title: 'Profile Updated',
    message: 'Your sync identity was updated successfully.',
    time: '1 day ago',
    type: 'info',
    read: true
  }
];

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-gwf-bg pb-24">
      <header className="p-6 bg-white border-b border-gwf-border sticky top-0 z-10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-gwf-bg rounded-xl transition-all border border-gwf-border active:scale-95"
            >
               <ArrowLeft size={20} className="text-gwf-muted" />
            </button>
            <h1 className="text-xl font-black italic tracking-tight">Activity Feed</h1>
         </div>
         {notifications.length > 0 && (
           <button 
             onClick={clearAll}
             className="text-[10px] font-black uppercase text-gwf-primary tracking-widest hover:underline active:scale-95 transition-transform"
           >
              Clear All
           </button>
         )}
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center opacity-40"
            >
               <Bell size={64} className="mb-4 text-gwf-muted" />
               <p className="text-sm font-black italic">No sync updates found.</p>
            </motion.div>
          ) : (
            notifications.map((n) => (
              <motion.div 
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-[32px] border transition-all flex gap-4 ${
                  n.read ? 'bg-white/50 border-gwf-border' : 'bg-white border-gwf-primary/20 shadow-lg shadow-gwf-primary/5'
                }`}
              >
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                   n.type === 'success' ? 'bg-gwf-success/10 text-gwf-success' :
                   n.type === 'warning' ? 'bg-gwf-warning/10 text-gwf-warning' :
                   'bg-gwf-primary/10 text-gwf-primary'
                 }`}>
                    {n.type === 'success' ? <CheckCircle2 size={24} /> :
                     n.type === 'warning' ? <AlertCircle size={24} /> :
                     <Zap size={24} />}
                 </div>
                 <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                       <h3 className={`text-sm font-black italic ${n.read ? 'text-gwf-muted' : 'text-gwf-text'}`}>
                          {n.title}
                       </h3>
                       <span className="text-[9px] font-bold text-gwf-muted flex items-center gap-1">
                          <Clock size={10} /> {n.time}
                       </span>
                    </div>
                    <p className="text-xs text-gwf-muted leading-relaxed font-medium">
                       {n.message}
                    </p>
                 </div>
                 {!n.read && (
                   <div className="w-2 h-2 rounded-full bg-gwf-primary shrink-0 self-center" />
                 )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
