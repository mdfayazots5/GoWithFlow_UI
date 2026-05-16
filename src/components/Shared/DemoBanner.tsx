import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { useLocation } from 'react-router-dom';

/**
 * DemoBanner Component
 * Shown at the top when the app is in demo mode.
 * Excluded from focus-mode screens (live-session and repractice).
 */
export default function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  // Hide on focus-heavy screens
  const isExcluded = location.pathname.startsWith('/live-session') || 
                     location.pathname.startsWith('/repractice');

  if (!isVisible || isExcluded) return null;

  return (
    <div className="bg-gwf-warning/20 border-b border-gwf-warning/30 px-4 py-2 flex items-center justify-between gap-4 z-[100] relative">
      <div className="flex items-center gap-2">
        <Info size={14} className="text-gwf-warning" />
        <p className="text-[10px] font-black italic text-gwf-warning uppercase tracking-widest">
          🧪 Demo Mode — Using sample data. No real data is saved.
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="p-1 hover:bg-gwf-warning/20 rounded-full transition-colors text-gwf-warning"
      >
        <X size={14} />
      </button>
    </div>
  );
}
