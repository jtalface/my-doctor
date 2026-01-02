import { Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { AuthProvider, ProtectedRoute } from './auth';

// Pages
import { SplashPage } from '@pages/SplashPage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { ProfileSetupPage } from '@pages/ProfileSetupPage';
import { DashboardPage } from '@pages/DashboardPage';
import { CheckupStartPage } from '@pages/CheckupStartPage';
import { CheckupConsentPage } from '@pages/CheckupConsentPage';
import { CheckupSessionPage } from '@pages/CheckupSessionPage';
import { VisitSummaryPage } from '@pages/VisitSummaryPage';
import { RedFlagAlertPage } from '@pages/RedFlagAlertPage';
import { HealthHistoryPage } from '@pages/HealthHistoryPage';
import { ProfilePage } from '@pages/ProfilePage';
import { SettingsPage } from '@pages/SettingsPage';
import { NotFoundPage } from '@pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
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
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
