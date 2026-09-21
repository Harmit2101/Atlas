import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { MarketsPage } from '@/pages/MarketsPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { PresentationModePage } from '@/pages/PresentationModePage';
import { SavedPage } from '@/pages/SavedPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { AccountPage } from '@/pages/AccountPage';
import { AdminLeadDeskPage } from '@/pages/AdminLeadDeskPage';
import { DealerDashboardPage } from '@/pages/DealerDashboardPage';
import { AgencyStorefrontPage } from '@/pages/AgencyStorefrontPage';
import { PrivateClientPage } from '@/pages/PrivateClientPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing & Marketing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/agency/:slug" element={<AgencyStorefrontPage />} />

      {/* Public Authentication Endpoints */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Public Discovery & Property Intelligence Experience */}
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/markets" element={<MarketsPage />} />
      <Route
        path="/property/:id"
        element={
          <ErrorBoundary componentName="Property Dossier">
            <PropertyDetailPage />
          </ErrorBoundary>
        }
      />
      <Route path="/property/:id/present" element={<PresentationModePage />} />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <SavedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/private-client"
        element={
          <ProtectedRoute>
            <PrivateClientPage />
          </ProtectedRoute>
        }
      />

      {/* Commercial Workspaces & Dealer Console */}
      <Route path="/dealer" element={<DealerDashboardPage />} />
      <Route path="/dealer-dashboard" element={<DealerDashboardPage />} />
      <Route
        path="/admin/inquiries"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLeadDeskPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin" element={<Navigate to="/admin/inquiries" replace />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
