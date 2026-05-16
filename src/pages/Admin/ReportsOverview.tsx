import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Users, 
  PlayCircle, 
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DUMMY_USERS } from '@/data/dummy/user.dummy';
import { DUMMY_SESSIONS } from '@/data/dummy/session.dummy';

export default function ReportsOverview() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = React.useState('Last 30 Days');
  const [isExporting, setIsExporting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data fetch
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const handleExport = () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      alert('Report generated! In a live environment, this would start a download of "GoWithFlow_Reports.xlsx"');
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gwf-border shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gwf-muted" size={16} />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gwf-bg border border-gwf-border rounded-[12px] py-2 pl-10 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-gwf-primary"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>
          
          {dateRange === 'Custom Range' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-3 bg-gwf-bg border border-gwf-border rounded-[12px] px-3 py-1.5 shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-gwf-muted px-1">From</span>
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-[11px] font-black outline-none text-gwf-text cursor-pointer focus:text-gwf-primary" 
                  />
                </div>
                <div className="h-6 w-[1px] bg-gwf-border rotate-[20deg]" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-gwf-muted px-1">To</span>
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-[11px] font-black outline-none text-gwf-text cursor-pointer focus:text-gwf-primary" 
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="relative">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gwf-muted" size={16} />
             <select className="bg-gwf-bg border border-gwf-border rounded-[12px] py-2 pl-10 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-gwf-primary">
               <option>All Users</option>
               {DUMMY_USERS.map(u => <option key={u.id}>{u.fullName}</option>)}
             </select>
          </div>
          
          <button 
            className={`p-2.5 border rounded-[12px] transition-all group ${
              isRefreshing 
              ? 'bg-gwf-bg border-gwf-border text-gwf-muted cursor-wait' 
              : 'bg-gwf-bg border-gwf-border hover:bg-gwf-primary/10 hover:border-gwf-primary/30 text-gwf-muted hover:text-gwf-primary'
            }`}
            title="Refresh Data"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <TrendingUp 
              size={18} 
              className={`transition-all duration-500 ${isRefreshing ? 'animate-pulse scale-110' : 'group-active:rotate-180'}`} 
            />
          </button>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className={`h-11 px-6 flex items-center gap-2 italic font-black text-sm shadow-xl rounded-xl transition-all duration-300 transform active:scale-95 ${
            isExporting 
            ? 'bg-gwf-muted text-white cursor-wait opacity-80' 
            : 'bg-gwf-primary text-white hover:bg-gwf-primary/90'
          }`}
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={18} className="pointer-events-none" />
          )}
          {isExporting ? 'Generating...' : 'Export Excel'}
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Avg Fluency Score" value="78%" icon={<TrendingUp />} color="bg-blue-50 text-gwf-primary" />
        <StatCard label="Total Sessions (MTD)" value="142" icon={<PlayCircle />} color="bg-orange-50 text-gwf-accent" />
        <StatCard label="Most Improved User" value="Ravi K." icon={<Award />} color="bg-green-50 text-gwf-success" />
        <StatCard label="Common Struggle" value="Have Been" icon={<Users />} color="bg-red-50 text-gwf-error" />
      </div>

      {/* User-wise Report Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-black italic tracking-tight text-gwf-text">User Performance Report</h3>
        <div className="bg-white rounded-[24px] border border-gwf-border shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gwf-bg/50 border-b border-gwf-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Sessions</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Avg Score</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest">Improvement</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gwf-muted tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gwf-border">
              {DUMMY_USERS.filter(u => u.role === 'USER').length > 0 ? (
                DUMMY_USERS.filter(u => u.role === 'USER').map((user) => (
                  <tr key={user.id} className="hover:bg-gwf-bg/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} className="w-8 h-8 rounded-full bg-gwf-bg" alt="" />
                        <span className="font-bold text-sm">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm italic">{user.totalSessionsPlayed}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gwf-primary text-sm">{(Math.random() * 20 + 60).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-600 font-black text-[10px] italic">+{(Math.random() * 10 + 2).toFixed(1)}% Up</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/admin/reports/user/${user.id}`)}
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-gwf-primary hover:bg-gwf-primary/5 px-3 py-2 rounded-lg transition-all"
                      >
                        View Full Report <ChevronRight size={14} className="pointer-events-none" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <TrendingUp size={48} className="text-gwf-muted" />
                      <p className="text-sm font-black italic">No performance data found for the selected range.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gwf-border shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black italic text-gwf-text tracking-tighter">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  );
}
