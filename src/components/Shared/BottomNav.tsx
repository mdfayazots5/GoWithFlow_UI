import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Play, 
  BookOpen, 
  User,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: 'Home', path: '/user/dashboard' },
    { icon: Play, label: 'Play', path: '/session/join' },
    { icon: BookOpen, label: 'Scripts', path: '/scripts' },
    { icon: User, label: 'Profile', path: '/user/profile' },
  ];

  // Hide nav on specific routes
  const hiddenRoutes = ['/login', '/register', '/otp-verify', '/game', '/repractice', '/admin'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gwf-border px-4 py-2 pb-safe z-40">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center p-2 min-w-[64px]"
            >
              <div className={`transition-all duration-300 ${isActive ? 'text-gwf-primary -translate-y-1' : 'text-gwf-muted'}`}>
                <Icon size={22} className={isActive ? 'fill-gwf-primary/10' : ''} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-1 transition-all ${isActive ? 'text-gwf-primary opacity-100' : 'text-gwf-muted opacity-60'}`}>
                {tab.label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -top-2 w-8 h-1 bg-gwf-primary rounded-full shadow-[0_0_10px_rgba(61,90,153,0.5)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
