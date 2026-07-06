import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/store/authStore";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import type { UserRole } from "@/routes";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import SchemesPage from "@/pages/Schemes";
import SchemeFormPage from "@/pages/SchemeForm";
import ApplicationsPage from "@/pages/Applications";
import ApplicationReviewPage from "@/pages/ApplicationReview";
import GrievancesPage from "@/pages/Grievances";
import GrievanceDetailPage from "@/pages/GrievanceDetail";
import CitizensPage from "@/pages/Citizens";
import CitizenDetailPage from "@/pages/CitizenDetail";
import AnalyticsPage from "@/pages/Analytics";
import UsersPage from "@/pages/Users";
import SettingsPage from "@/pages/Settings";

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role as UserRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function LoadingFallback() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute roles={["officer", "admin", "super_admin"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        <Route
          path="overview"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="schemes"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SchemesPage />
            </Suspense>
          }
        />
        <Route
          path="schemes/new"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SchemeFormPage />
            </Suspense>
          }
        />
        <Route
          path="schemes/:id/edit"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SchemeFormPage />
            </Suspense>
          }
        />
        <Route
          path="applications"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ApplicationsPage />
            </Suspense>
          }
        />
        <Route
          path="applications/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ApplicationReviewPage />
            </Suspense>
          }
        />
        <Route
          path="grievances"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <GrievancesPage />
            </Suspense>
          }
        />
        <Route
          path="grievances/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <GrievanceDetailPage />
            </Suspense>
          }
        />
        <Route
          path="citizens"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CitizensPage />
            </Suspense>
          }
        />
        <Route
          path="citizens/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CitizenDetailPage />
            </Suspense>
          }
        />
        <Route
          path="analytics"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AnalyticsPage />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <UsersPage />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SettingsPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
