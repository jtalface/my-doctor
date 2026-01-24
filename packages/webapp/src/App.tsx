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

// Glucose Tracker - Lazy loaded for code splitting (opt-in feature for diabetes management)
const GlucoseEntryPage = lazy(() => import('@pages/GlucoseEntryPage').then(m => ({ default: m.GlucoseEntryPage })));
const GlucoseDashboardPage = lazy(() => import('@pages/GlucoseDashboardPage').then(m => ({ default: m.GlucoseDashboardPage })));
const GlucoseLogPage = lazy(() => import('@pages/GlucoseLogPage').then(m => ({ default: m.GlucoseLogPage })));
const GlucoseInsightsPage = lazy(() => import('@pages/GlucoseInsightsPage').then(m => ({ default: m.GlucoseInsightsPage })));
const GlucoseReportsPage = lazy(() => import('@pages/GlucoseReportsPage').then(m => ({ default: m.GlucoseReportsPage })));
const GlucoseSettingsPage = lazy(() => import('@pages/GlucoseSettingsPage').then(m => ({ default: m.GlucoseSettingsPage })));
const GlucoseOnboardingPage = lazy(() => import('@pages/GlucoseOnboardingPage').then(m => ({ default: m.GlucoseOnboardingPage })));

// BP Tracker - Lazy loaded for code splitting (opt-in feature for blood pressure management)
const BPEntryPage = lazy(() => import('@pages/BPEntryPage').then(m => ({ default: m.BPEntryPage })));
const BPDashboardPage = lazy(() => import('@pages/BPDashboardPage').then(m => ({ default: m.BPDashboardPage })));
const BPSessionLogPage = lazy(() => import('@pages/BPSessionLogPage').then(m => ({ default: m.BPSessionLogPage })));
const BPInsightsPage = lazy(() => import('@pages/BPInsightsPage').then(m => ({ default: m.BPInsightsPage })));
const BPReportsPage = lazy(() => import('@pages/BPReportsPage').then(m => ({ default: m.BPReportsPage })));
const BPSettingsPage = lazy(() => import('@pages/BPSettingsPage').then(m => ({ default: m.BPSettingsPage })));
const BPOnboardingPage = lazy(() => import('@pages/BPOnboardingPage').then(m => ({ default: m.BPOnboardingPage })));

// Checkout/Payments - Lazy loaded
const CheckoutPage = lazy(() => import('@pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));

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
              
              {/* Glucose Tracker - Code-split for performance */}
              <Route path="/glucose" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <GlucoseEntryPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/glucose/dashboard" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <GlucoseDashboardPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/glucose/log" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <GlucoseLogPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/glucose/insights" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <GlucoseInsightsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/glucose/reports" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <GlucoseReportsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/glucose/settings" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <GlucoseSettingsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/glucose/onboarding" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <GlucoseOnboardingPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Blood Pressure Tracker - Code-split for performance */}
              <Route path="/bp" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BPEntryPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/bp/dashboard" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BPDashboardPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/bp/log" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BPSessionLogPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/bp/insights" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BPInsightsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/bp/reports" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BPReportsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/bp/settings" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BPSettingsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/bp/onboarding" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BPOnboardingPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Checkout/Payments - Code-split for performance */}
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CheckoutPage />
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
