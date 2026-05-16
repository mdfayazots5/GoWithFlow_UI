import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  Flame, 
  Settings, 
  Menu,
  Wind
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title, showBack = false }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  // Hide header on specific routes
  const hiddenRoutes = ['/login', '/register', '/otp-verify', '/game', '/repractice'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  const isHome = location.pathname === '/';

  return (
    <header className="p-6 bg-white border-b border-gwf-border flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {showBack && !isHome ? (
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gwf-bg rounded-xl transition-all">
            <ChevronLeft size={20} className="text-gwf-muted" />
          </button>
        ) : (
          <button 
            onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard')} 
            className="text-gwf-primary font-black italic text-xl tracking-tighter cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1.5 focus:outline-none"
          >
            <Wind className="text-gwf-accent" size={24} />
            <span>Go With Flow<span className="text-gwf-accent">.</span></span>
          </button>
        )}
        {title && (
          <div className="h-6 w-[1px] bg-gwf-border mx-1" />
        )}
        {title && (
          <h1 className="text-sm font-black italic text-gwf-text tracking-tight">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate('/user/progress')}
          className="flex items-center gap-1.5 px-3 py-1 bg-gwf-accent/10 rounded-full border border-gwf-accent/20 hover:bg-gwf-accent/20 transition-all active:scale-95"
        >
           <Flame size={14} className="text-gwf-accent" />
           <span className="text-[10px] font-black italic text-gwf-accent">7</span>
        </button>
        <button 
          onClick={() => navigate('/user/profile')}
          className="w-10 h-10 rounded-full bg-gwf-primary/10 border border-gwf-border overflow-hidden p-0.5 hover:scale-105 transition-transform"
        >
           <img src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="" className="w-full h-full object-cover rounded-full" />
        </button>
      </div>
    </header>
  );
}
