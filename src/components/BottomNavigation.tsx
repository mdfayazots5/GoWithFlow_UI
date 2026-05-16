import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  TrendingUp, 
  Settings 
} from 'lucide-react';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass p-2 rounded-[32px] border-2 border-gwf-primary/20 shadow-2xl z-40 flex gap-2">
      <button 
        onClick={() => navigate('/')} 
        className={`p-4 rounded-2xl transition-all duration-300 ${
           isActive('/') 
           ? 'bg-gwf-primary text-white shadow-xl glow-gwf-primary' 
           : 'text-gwf-muted hover:text-gwf-primary hover:bg-gwf-primary/10'
        }`}
      >
        <LayoutDashboard size={24} />
      </button>
      <button 
        onClick={() => navigate('/scripts')} 
        className={`p-4 rounded-2xl transition-all duration-300 ${
           isActive('/scripts') 
           ? 'bg-gwf-primary text-white shadow-xl glow-gwf-primary' 
           : 'text-gwf-muted hover:text-gwf-primary hover:bg-gwf-primary/10'
        }`}
      >
        <BookOpen size={24} />
      </button>
      <button 
        onClick={() => navigate('/user/progress')} 
        className={`p-4 rounded-2xl transition-all duration-300 ${
           isActive('/user/progress') 
           ? 'bg-gwf-primary text-white shadow-xl glow-gwf-primary' 
           : 'text-gwf-muted hover:text-gwf-primary hover:bg-gwf-primary/10'
        }`}
      >
        <TrendingUp size={24} />
      </button>
      <button 
        onClick={() => navigate('/user/settings')} 
        className={`p-4 rounded-2xl transition-all duration-300 ${
           isActive('/user/settings') 
           ? 'bg-gwf-primary text-white shadow-xl glow-gwf-primary' 
           : 'text-gwf-muted hover:text-gwf-primary hover:bg-gwf-primary/10'
        }`}
      >
        <Settings size={24} />
      </button>
    </div>
  );
}
