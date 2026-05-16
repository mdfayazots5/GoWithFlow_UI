import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function OtpVerifyPage() {
  const { verifyOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      setIsLoading(true);
      setError(null);
      try {
        const result = await verifyOtp(phone, otpString);
        navigate(result.role === 'ADMIN' ? '/admin/dashboard' : '/');
      } catch (err: any) {
        setError(err.message || 'Verification failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gwf-bg flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8"
      >
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gwf-muted hover:text-gwf-primary font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Change Number
        </button>

        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gwf-border space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black italic text-gwf-text">Verify Identity</h2>
            <p className="text-gwf-muted font-medium italic">Enter 6-digit code sent to <span className="text-gwf-text font-bold">+91 {phone}</span></p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input 
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-12 h-16 text-center bg-gwf-bg border border-gwf-border rounded-[16px] text-2xl font-black focus:ring-2 focus:ring-gwf-primary outline-none transition-all"
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-gwf-muted">
                Resend OTP in <span className="text-gwf-primary font-black tabular-nums">{formatTime(timer)}</span>
              </p>
            </div>

            <button 
              onClick={handleVerify}
              disabled={isLoading || otp.join('').length < 6}
              className="w-full btn-primary h-[52px] text-lg disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-gwf-error/10 text-gwf-error text-xs font-black rounded-2xl justify-center uppercase tracking-widest">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
