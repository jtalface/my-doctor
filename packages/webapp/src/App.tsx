import { Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { UserProvider } from './store/UserContext';

// Pages
import { SplashPage } from '@pages/SplashPage';
import { LoginPage } from '@pages/LoginPage';
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
    <UserProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile/setup" element={<ProfileSetupPage />} />
        
        {/* Protected routes with layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/checkup/start" element={<CheckupStartPage />} />
          <Route path="/checkup/consent" element={<CheckupConsentPage />} />
          <Route path="/checkup/session/:id" element={<CheckupSessionPage />} />
          <Route path="/checkup/alert" element={<RedFlagAlertPage />} />
          <Route path="/checkup/summary/:id" element={<VisitSummaryPage />} />
          <Route path="/history" element={<HealthHistoryPage />} />
          <Route path="/history/:id" element={<VisitSummaryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
