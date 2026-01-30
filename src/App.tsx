import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import { useAuth } from './state/AuthContext';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Content = lazy(() => import('./pages/Content'));
const Series = lazy(() => import('./pages/Series'));
const ManageSeriesPage = lazy(() => import('./pages/ManageSeriesPage'));
const Users = lazy(() => import('./pages/Users'));
const Health = lazy(() => import('./pages/Health'));

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/content" element={<Content />} />
                  <Route path="/series" element={<Series />} />
                  <Route path="/series/:seriesId/manage" element={<ManageSeriesPage />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
