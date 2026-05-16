import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'motion/react';
import { Phone, ArrowRight, ShieldCheck, User as UserIcon, ShieldAlert, Wind } from 'lucide-react';
import { DUMMY_USERS } from '@/data/dummy/user.dummy';

export default function LoginPage() {
  const { requestOtp, loginWithDummy, isDemo } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phone.length === 10) {
      setIsLoading(true);
      try {
        await requestOtp(phone);
        navigate(`/otp-verify?phone=${phone}`);
      } catch (err: any) {
        setError(err.message || 'Failed to send OTP');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Please enter a valid 10-digit mobile number');
    }
  };

  const handleDemoLogin = (role: 'ADMIN' | 'USER') => {
    const dummy = role === 'ADMIN' ? DUMMY_USERS[0] : DUMMY_USERS[1];
    loginWithDummy(dummy);
    navigate(role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard');
  };

  return (
    <div className="min-h-screen bg-gwf-bg flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="p-4 bg-white rounded-3xl shadow-xl shadow-gwf-primary/5 border border-gwf-border">
            <Wind className="text-gwf-accent" size={48} />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-gwf-primary italic">Go With Flow<span className="text-gwf-accent">.</span></h1>
            <p className="text-gwf-muted font-medium italic">Speak. Together. Grow.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gwf-border space-y-6">
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gwf-muted uppercase tracking-[0.2em] ml-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gwf-muted font-bold text-sm">
                  <Phone size={16} />
                  <span>+91</span>
                </div>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  className="w-full bg-gwf-bg border border-gwf-border rounded-[16px] py-4 pl-16 pr-4 text-lg font-bold focus:ring-2 focus:ring-gwf-primary outline-none transition-all"
                />
              </div>
              {error && <p className="text-[10px] text-gwf-error font-bold ml-1">{error}</p>}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary h-[52px] flex items-center justify-center gap-2 group text-lg"
            >
              {isLoading ? 'Sending...' : 'Send OTP'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {isDemo && (
            <div className="space-y-6">
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gwf-border"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black text-gwf-muted tracking-widest">
                  <span className="bg-white px-3 italic">Demo Access</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gwf-border hover:border-gwf-primary hover:bg-gwf-primary/5 transition-all group"
                >
                  <div className="p-3 bg-gwf-primary/10 rounded-xl text-gwf-primary group-hover:scale-110 transition-transform">
                    <ShieldCheck size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight">Admin Demo</span>
                </button>
                <button 
                  onClick={() => handleDemoLogin('USER')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gwf-border hover:border-gwf-accent hover:bg-gwf-accent/5 transition-all group"
                >
                  <div className="p-3 bg-gwf-accent/10 rounded-xl text-gwf-accent group-hover:scale-110 transition-transform">
                    <UserIcon size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight">User Demo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gwf-muted font-medium">
          New to Go With Flow? <Link to="/register" className="text-gwf-primary font-bold hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
