import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientProfilePage } from '@/pages/ClientProfilePage';
import { SessionSetupPage } from '@/pages/SessionSetupPage';
import { ClientExerciseViewPage } from '@/pages/ClientExerciseViewPage';
import { PostSessionNotesPage } from '@/pages/PostSessionNotesPage';
import { SessionReportPage } from '@/pages/SessionReportPage';
import { HelpPage } from '@/pages/HelpPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

function OnlineStatusWatcher() {
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
  }, []);

  useEffect(() => {
    const handleOffline = () => toast.warning('You are offline. Session data may not save.', { id: 'offline', duration: Infinity });
    const handleOnline  = () => { toast.dismiss('offline'); toast.success('Back online.', { id: 'online', duration: 3000 }); };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <OnlineStatusWatcher />
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Professional routes — protected, AppLayout shell */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="clients/:clientId" element={<ClientProfilePage />} />
              <Route path="session/setup" element={<SessionSetupPage />} />
              <Route path="session/:sessionId/report" element={<SessionReportPage />} />
              <Route path="roadmap" element={<RoadmapPage />} />
              <Route path="help" element={<HelpPage />} />
            </Route>

            {/* Client-facing routes — no AppLayout, full-screen isolation */}
            <Route path="/session/exercise" element={
              <ProtectedRoute>
                <ClientExerciseViewPage />
              </ProtectedRoute>
            } />
            <Route path="/session/notes" element={
              <ProtectedRoute>
                <PostSessionNotesPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}
