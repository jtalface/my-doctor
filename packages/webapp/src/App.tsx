import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { AuthProvider, ProtectedRoute } from './auth';
import { ActiveProfileProvider, CallProvider } from './contexts';

// Pages
import { SplashPage } from '@pages/SplashPage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { ProfileSetupPage } from '@pages/ProfileSetupPage';
import { DependentProfileSetupPage } from '@pages/DependentProfileSetupPage';
import { DashboardPage } from '@pages/DashboardPage';
import { CheckupStartPage } from '@pages/CheckupStartPage';
import { CheckupConsentPage } from '@pages/CheckupConsentPage';
import { CheckupSessionPage } from '@pages/CheckupSessionPage';
import { VisitSummaryPage } from '@pages/VisitSummaryPage';
import { RedFlagAlertPage } from '@pages/RedFlagAlertPage';
import { HealthHistoryPage } from '@pages/HealthHistoryPage';
import { ProfilePage } from '@pages/ProfilePage';
import { SettingsPage } from '@pages/SettingsPage';
import { MessagesPage } from '@pages/MessagesPage';
import { NotFoundPage } from '@pages/NotFoundPage';

// Cycle Tracker - Lazy loaded for code splitting (female-only feature)
const CycleTrackerPage = lazy(() => import('@pages/CycleTrackerPage').then(m => ({ default: m.CycleTrackerPage })));
const CycleDailyLogPage = lazy(() => import('@pages/CycleDailyLogPage').then(m => ({ default: m.CycleDailyLogPage })));
const CycleInsightsPage = lazy(() => import('@pages/CycleInsightsPage').then(m => ({ default: m.CycleInsightsPage })));
const CycleSettingsPage = lazy(() => import('@pages/CycleSettingsPage').then(m => ({ default: m.CycleSettingsPage })));
const CycleOnboardingPage = lazy(() => import('@pages/CycleOnboardingPage').then(m => ({ default: m.CycleOnboardingPage })));

// Loading component for lazy-loaded routes
function PageLoader() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontSize: '1.5rem'
    }}>
      Loading...
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CallProvider>
        <ActiveProfileProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Semi-protected route (new users only) */}
            <Route path="/profile/setup" element={
              <ProtectedRoute>
                <ProfileSetupPage />
              </ProtectedRoute>
            } />
            
            {/* Protected routes with layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/checkup/start" element={
                <ProtectedRoute>
                  <CheckupStartPage />
                </ProtectedRoute>
              } />
              <Route path="/checkup/consent" element={
                <ProtectedRoute>
                  <CheckupConsentPage />
                </ProtectedRoute>
              } />
              <Route path="/checkup/session/:id" element={
                <ProtectedRoute>
                  <CheckupSessionPage />
                </ProtectedRoute>
              } />
              <Route path="/checkup/alert" element={
                <ProtectedRoute>
                  <RedFlagAlertPage />
                </ProtectedRoute>
              } />
              <Route path="/checkup/summary/:id" element={
                <ProtectedRoute>
                  <VisitSummaryPage />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <HealthHistoryPage />
                </ProtectedRoute>
              } />
              <Route path="/history/:id" element={
                <ProtectedRoute>
                  <VisitSummaryPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/dependent/:id/profile/setup" element={
                <ProtectedRoute>
                  <DependentProfileSetupPage />
                </ProtectedRoute>
              } />
              
              {/* Cycle Tracker - Code-split for performance */}
              <Route path="/cycle" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CycleTrackerPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/cycle/log/:date" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CycleDailyLogPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/cycle/insights" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CycleInsightsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/cycle/settings" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CycleSettingsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/cycle/onboarding" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CycleOnboardingPage />
                  </Suspense>
                </ProtectedRoute>
              } />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ActiveProfileProvider>
      </CallProvider>
    </AuthProvider>
  );
}

export default App;
