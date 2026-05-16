import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'motion/react';
import { UserPlus, ArrowLeft, Camera, Check } from 'lucide-react';
import { User } from '@/types';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
];

export default function RegisterPage() {
  const { register, isDemo } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    ageGroup: 'Adult (18+)' as User['ageGroup'],
    preferredHintLanguage: 'Telugu' as User['preferredHintLanguage'],
    avatar: AVATARS[0],
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.mobileNumber.length === 10) {
      setIsLoading(true);
      try {
        await register(formData);
        alert('Account created successfully! Please login.');
        navigate('/login');
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gwf-bg py-12 px-6 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-xl space-y-8"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-gwf-muted hover:text-gwf-primary mb-2 font-bold transition-colors">
          <ArrowLeft size={20} /> Back to Login
        </Link>

        <div className="space-y-2 text-center">
           <h1 className="text-5xl font-black text-gwf-primary tracking-tighter italic">Join Go With Flow<span className="text-gwf-accent">.</span></h1>
           <p className="text-gwf-muted font-medium italic">Create an account for your family member.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl border border-gwf-border space-y-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gwf-bg shadow-xl">
                 <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 bg-gwf-primary text-white rounded-full shadow-lg">
                <Camera size={18} />
              </div>
            </div>
            <div className="flex gap-4">
              {AVATARS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setFormData({...formData, avatar: url})}
                  className={`w-12 h-12 rounded-full overflow-hidden border-4 transition-all relative ${
                    formData.avatar === url ? 'border-gwf-primary scale-110 shadow-lg' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                  {formData.avatar === url && (
                    <div className="absolute inset-0 bg-gwf-primary/20 flex items-center justify-center">
                      <Check size={16} className="text-gwf-primary font-bold" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gwf-muted uppercase tracking-[0.2em] ml-1">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full bg-gwf-bg border border-gwf-border rounded-[20px] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gwf-primary outline-none transition-all"
                placeholder="e.g. Ravi Kumar"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gwf-muted uppercase tracking-[0.2em] ml-1">Mobile Number</label>
              <input 
                required
                type="tel" 
                value={formData.mobileNumber}
                onChange={(e) => setFormData({...formData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                className="w-full bg-gwf-bg border border-gwf-border rounded-[20px] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gwf-primary outline-none transition-all"
                placeholder="10-digit number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gwf-muted uppercase tracking-[0.2em] ml-1">Email Address (Optional)</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-gwf-bg border border-gwf-border rounded-[20px] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gwf-primary outline-none transition-all"
              placeholder="ravi@example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gwf-muted uppercase tracking-[0.2em] ml-1">Age Group</label>
              <div className="relative">
                <select 
                  value={formData.ageGroup}
                  onChange={(e) => setFormData({...formData, ageGroup: e.target.value as User['ageGroup']})}
                  className="w-full bg-gwf-bg border border-gwf-border rounded-[20px] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gwf-primary outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Child (6-12)">Child (6-12)</option>
                  <option value="Teen (13-17)">Teen (13-17)</option>
                  <option value="Adult (18+)">Adult (18+)</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gwf-muted">
                  ▼
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gwf-muted uppercase tracking-[0.2em] ml-1">Hint Language</label>
              <div className="relative">
                <select 
                  value={formData.preferredHintLanguage}
                  onChange={(e) => setFormData({...formData, preferredHintLanguage: e.target.value as User['preferredHintLanguage']})}
                  className="w-full bg-gwf-bg border border-gwf-border rounded-[20px] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gwf-primary outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Telugu">Telugu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Kannada">Kannada</option>
                  <option value="None">None (English only)</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gwf-muted">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 text-xl font-black h-[64px] shadow-xl glow-primary"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'} <UserPlus size={24} />
          </button>
        </form>

        <p className="text-center font-bold text-gwf-muted pb-8">
          Already a member? <Link to="/login" className="text-gwf-primary hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
