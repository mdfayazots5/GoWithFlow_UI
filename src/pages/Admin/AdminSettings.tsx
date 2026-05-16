import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Database,
  Save
} from 'lucide-react';

export default function AdminSettings() {
  const [tfaEnabled, setTfaEnabled] = useState(true);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black italic text-gwf-text tracking-tight uppercase">System Settings</h1>
        <p className="text-gwf-muted italic">Configure global platform parameters and security.</p>
      </div>

      <div className="space-y-6">
        {/* Platform Config */}
        <div className="bg-white p-6 rounded-3xl border border-gwf-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gwf-primary/10 flex items-center justify-center text-gwf-primary">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black italic text-gwf-text tracking-tight uppercase">Platform Configuration</h2>
              <p className="text-xs text-gwf-muted">General site behavior and localized settings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gwf-muted tracking-widest px-1">Organization Name</label>
              <input 
                type="text" 
                defaultValue="GoWithFlow Academy"
                className="w-full bg-gwf-bg border-2 border-gwf-border rounded-xl px-4 py-3 font-bold focus:border-gwf-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gwf-muted tracking-widest px-1">Default Language</label>
              <select className="w-full bg-gwf-bg border-2 border-gwf-border rounded-xl px-4 py-3 font-bold focus:border-gwf-primary outline-none transition-all">
                <option>English (Global)</option>
                <option>Hindi</option>
                <option>Spanish</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-3xl border border-gwf-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black italic text-gwf-text tracking-tight uppercase">Security & Access</h2>
              <p className="text-xs text-gwf-muted">Authentication rules and admin permissions.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gwf-bg rounded-2xl border border-gwf-border/50">
              <div>
                <p className="font-black italic text-gwf-text uppercase text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-gwf-muted">Require 2FA for all admin accounts.</p>
              </div>
              <button 
                onClick={() => setTfaEnabled(!tfaEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${tfaEnabled ? 'bg-gwf-primary' : 'bg-gwf-muted/30'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${tfaEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button className="bg-gwf-primary text-white px-8 py-4 rounded-2xl font-black italic flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gwf-primary/20 uppercase tracking-widest text-sm">
            <Save size={20} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
