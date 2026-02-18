/**
 * App.tsx - Main router configuration
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/auth.store';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// User pages
import UserDashboard from '@/pages/user/UserDashboard';
import SubmitComplaint from '@/pages/user/SubmitComplaint';
import ComplaintHistory from '@/pages/user/ComplaintHistory';
import ComplaintDetail from '@/pages/user/ComplaintDetail';
import UserProfile from '@/pages/user/UserProfile';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ComplaintQueue from '@/pages/admin/ComplaintQueue';

// Super Admin pages
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import DepartmentManagement from '@/pages/superadmin/DepartmentManagement';
import UserManagement from '@/pages/superadmin/UserManagement';

function DashboardRedirect() {
    const { role } = useAuthStore();
    if (role === 'super_admin') return <SuperAdminDashboard />;
    if (role === 'admin') return <AdminDashboard />;
    return <UserDashboard />;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                {/* Shared */}
                <Route path="/dashboard" element={<DashboardRedirect />} />
                <Route path="/complaint/:id" element={<ComplaintDetail />} />
                <Route path="/profile" element={<UserProfile />} /> {/* Added UserProfile route */}

                {/* User routes */}
                <Route path="/submit" element={
                    <ProtectedRoute allowedRoles={['user']}>
                        <SubmitComplaint />
                    </ProtectedRoute>
                } />
                <Route path="/my-complaints" element={
                    <ProtectedRoute allowedRoles={['user']}>
                        <ComplaintHistory />
                    </ProtectedRoute>
                } />

                {/* Admin routes */}
                <Route path="/queue" element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <ComplaintQueue />
                    </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Super Admin routes */}
                <Route path="/departments" element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <DepartmentManagement />
                    </ProtectedRoute>
                } />
                <Route path="/users" element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                        <UserManagement />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster position="top-right" richColors closeButton />
            </AuthProvider>
        </BrowserRouter>
    );
}
