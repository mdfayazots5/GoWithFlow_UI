import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import OtpVerifyPage from './pages/Auth/OtpVerifyPage';
import Dashboard from './pages/Dashboard';
import SessionList from './pages/User/SessionList';
import Profile from './pages/User/Profile';
import Notifications from './pages/User/Notifications';
import SessionDetail from './pages/User/SessionDetail';
import MyMistakes from './pages/User/MyMistakes';
import ImprovementTracker from './pages/User/ImprovementTracker';
import RepracticeRound from './pages/Game/RepracticeRound';
import CreateSession from './pages/Session/CreateSession';
import JoinSession from './pages/Session/JoinSession';
import Lobby from './pages/Session/Lobby';
import SessionRoom from './pages/Game/SessionRoom';
import SessionReport from './pages/Assessment/SessionReport';
import ScriptLibrary from './pages/Scripts/ScriptLibrary';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ScriptManagement from './pages/Admin/ScriptManagement';
import UserManagement from './pages/Admin/UserManagement';
import ReportsOverview from './pages/Admin/ReportsOverview';
import UserDetailReport from './pages/Admin/UserDetailReport';
import ScriptUpload from './pages/Admin/ScriptUpload';
import AdminSettings from './pages/Admin/AdminSettings';
import SessionManagement from './pages/Admin/SessionManagement';
import AdminLayout from './components/Admin/AdminLayout';
import Header from './components/Shared/Header';
import BottomNav from './components/Shared/BottomNav';
import ToastContainer from './components/Shared/Toast';
import LoaderOverlay from './components/Shared/Loader';
import DemoBanner from './components/Shared/DemoBanner';

import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'ADMIN' | 'USER' }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gwf-bg text-gwf-primary font-black italic">
       Syncing Identity...
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  if (role && user.role !== role) {
    if (user.role === 'ADMIN') return <>{children}</>; // Admin can access everything
    return <Navigate to="/user/dashboard" />;
  }
  
  return <>{children}</>;
}

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { user, isDemo } = useAuth();
  const [authorized, setAuthorized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (isDemo) {
      setAuthorized(true);
      return;
    }

    if (!id || !user) {
      setAuthorized(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const memberRef = doc(db, 'sessions', id, 'members', user.id);
        const memberSnap = await getDoc(memberRef);
        setAuthorized(memberSnap.exists());
      } catch (err) {
        setAuthorized(false);
      }
    };

    checkAccess();
  }, [id, user, isDemo]);

  if (authorized === null) return (
    <div className="min-h-screen flex items-center justify-center bg-gwf-bg text-gwf-primary font-black italic">
       Authenticating Sync...
    </div>
  );

  if (!authorized) return <Navigate to="/user/dashboard" />;

  return <>{children}</>;
}

function UserLayout() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="min-h-screen bg-gwf-bg">
      <Header />
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gwf-bg text-gwf-primary font-black italic">
       Syncing Identity...
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DemoBanner />
        <ToastContainer />
        <LoaderOverlay />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp-verify" element={<OtpVerifyPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RootRedirect />} />
          
          {/* User Module */}
          <Route path="/user" element={
            <ProtectedRoute role="USER">
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="progress" element={<ImprovementTracker />} />
            <Route path="mistakes" element={<MyMistakes />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="sessions" element={<SessionList />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
          </Route>

          <Route path="/scripts" element={
            <ProtectedRoute role="USER">
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ScriptLibrary />} />
          </Route>

          <Route path="/session" element={
            <ProtectedRoute role="USER">
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route path="join" element={<JoinSession />} />
            <Route path="lobby/:id" element={<Lobby />} />
            <Route path="report/:id" element={<SessionReport />} />
          </Route>

          <Route path="/live-session/:id" element={
            <ProtectedRoute role="USER">
              <SessionGuard>
                <SessionRoom />
              </SessionGuard>
            </ProtectedRoute>
          } />

          <Route path="/repractice" element={
            <ProtectedRoute role="USER">
              <RepracticeRound />
            </ProtectedRoute>
          } />

          <Route path="/repractice/:id" element={
            <ProtectedRoute role="USER">
              <RepracticeRound />
            </ProtectedRoute>
          } />

          {/* Admin Module */}
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="scripts" element={<ScriptManagement />} />
            <Route path="sessions" element={<SessionManagement />} />
            <Route path="sessions/create" element={<CreateSession />} />
            <Route path="scripts/upload" element={<ScriptUpload />} />
            <Route path="scripts/edit/:id" element={<ScriptUpload />} />
            <Route path="reports" element={<ReportsOverview />} />
            <Route path="reports/user/:userId" element={<UserDetailReport />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
