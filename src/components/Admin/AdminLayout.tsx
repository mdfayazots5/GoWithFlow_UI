import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  PlayCircle, 
  TrendingUp, 
  Settings, 
  LogOut,
  Menu,
  X,
  Wind
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Scripts', path: '/admin/scripts', icon: FileText },
    { name: 'Sessions', path: '/admin/sessions', icon: PlayCircle },
    { name: 'Reports', path: '/admin/reports', icon: TrendingUp },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const PageTitle = navLinks.find(link => location.pathname.startsWith(link.path))?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-gwf-bg flex">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white border-r border-gwf-border hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <h1 
            onClick={() => navigate('/admin/dashboard')}
            className="text-2xl font-black italic tracking-tighter text-gwf-primary flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Wind className="text-gwf-accent" size={28} />
            <span>Go With Flow<span className="text-gwf-accent">.</span></span>
          </h1>
          <p className="text-[10px] font-black uppercase text-gwf-muted tracking-widest mt-1">Admin Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                    ? 'bg-gwf-primary/10 text-gwf-primary border-l-4 border-gwf-primary' 
                    : 'text-gwf-muted hover:text-gwf-primary hover:bg-gwf-primary/5'
                }`}
              >
                <Icon size={20} /> {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gwf-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gwf-error hover:bg-gwf-error/5 rounded-xl font-bold transition-all text-sm uppercase tracking-wider"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden p-4 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8 p-4">
                <h1 
                  onClick={() => {
                    navigate('/admin/dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-2xl font-black italic tracking-tighter text-gwf-primary flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Wind className="text-gwf-accent" size={28} />
                  <span>Go With Flow<span className="text-gwf-accent">.</span></span>
                </h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gwf-muted">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname.startsWith(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                        isActive 
                          ? 'bg-gwf-primary/10 text-gwf-primary' 
                          : 'text-gwf-muted hover:text-gwf-primary hover:bg-gwf-primary/5'
                      }`}
                    >
                      <Icon size={20} /> {link.name}
                    </Link>
                  );
                })}
              </nav>

              <button 
                onClick={handleLogout}
                className="mt-auto flex items-center gap-3 px-4 py-3 text-gwf-error hover:bg-gwf-error/5 rounded-xl font-bold transition-all"
              >
                <LogOut size={20} /> Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gwf-border flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gwf-muted md:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-black italic text-gwf-text tracking-tight uppercase">{PageTitle}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-gwf-text italic">{user?.fullName}</span>
              <span className="text-[10px] font-bold text-gwf-muted uppercase tracking-widest">{user?.role}</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-gwf-primary overflow-hidden bg-gwf-bg">
              <img 
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`} 
                alt="Admin" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
