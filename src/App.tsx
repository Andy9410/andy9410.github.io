import { lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";
import AdminRoute from "./auth/AdminRoute";

const Index = lazy(() => import("./pages/Index"));
const ApoyoPage = lazy(() => import("./pages/ApoyoPage"));
const CarreraPage = lazy(() => import("./pages/CarreraPage"));
const IAPage = lazy(() => import("./pages/IAPage"));
const TutoriaMetricsDemoPage = lazy(() => import("./pages/demo/TutoriaMetricsDemoPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const LearningProfilePage = lazy(() => import("./pages/LearningProfilePage"));
const AdminLearningProfilePage = lazy(() => import("./pages/admin/AdminLearningProfilePage"));
const MetricsPage = lazy(() => import("./pages/admin/MetricsPage"));
const ConversationsPage = lazy(() => import("./pages/admin/ConversationsPage"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const DocumentsPage = lazy(() => import("./pages/admin/DocumentsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500" />
  </div>
);

const App = () => (
  <Sentry.ErrorBoundary fallback={<AppFallback />} showDialog={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Suspense fallback={<AppFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/apoyo-universitario" element={<ApoyoPage />} />
                <Route path="/carrera-it" element={<CarreraPage />} />
                <Route path="/ia-para-adultos" element={<IAPage />} />
                <Route path="/demo/tutoria-metrics" element={<TutoriaMetricsDemoPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/learning-profile" element={<LearningProfilePage />} />
                  <Route element={<AdminRoute />}>
                    <Route path="/admin/metrics" element={<MetricsPage />} />
                    <Route path="/admin/users" element={<UsersPage />} />
                    <Route path="/admin/users/:email/profile" element={<AdminLearningProfilePage />} />
                    <Route path="/admin/documents" element={<DocumentsPage />} />
                    <Route path="/admin/conversations" element={<ConversationsPage />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
