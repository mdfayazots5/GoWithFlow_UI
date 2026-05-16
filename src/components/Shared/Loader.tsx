import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLoader } from '@/lib/loaderService';

export default function LoaderOverlay() {
  const { isLoading, message } = useLoader();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-gwf-bg/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="relative">
             <div className="w-16 h-16 rounded-full border-4 border-gwf-primary/20 border-t-gwf-primary animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gwf-primary/10 rounded-full animate-pulse" />
             </div>
          </div>
          {message && (
             <motion.p 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-6 text-gwf-text font-black italic tracking-tight"
             >
               {message}
             </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
