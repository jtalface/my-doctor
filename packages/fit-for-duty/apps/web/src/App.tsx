import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import {
  LoginPage,
  DashboardPage,
  AssessmentListPage,
  AssessmentDetailPage,
  NewAssessmentPage,
} from '@/pages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/assessments"
        element={
          <ProtectedRoute>
            <AssessmentListPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/assessments/new"
        element={
          <ProtectedRoute>
            <NewAssessmentPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/assessments/:id"
        element={
          <ProtectedRoute>
            <AssessmentDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
