import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import Layout from './components/Layout';
import SessionWarning from './components/SessionWarning';
import OfflineIndicator from './components/OfflineIndicator';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Sales from './pages/Sales';
import Telecalling from './pages/Telecalling';
import Employees from './pages/Employees';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Certificates from './pages/Certificates';
import Documents from './pages/Documents';
import IDCards from './pages/IDCards';
import Reports from './pages/Reports';
import Internship from './pages/Internship';
import Progress from './pages/Progress';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import Finance from './pages/Finance';
import UserManagement from './pages/UserManagement';

/**
 * Enhanced Protected Route Component
 * Handles authentication, role-based access, and user status checks
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.module - Module name for permission checking (optional)
 * @param {array} props.roles - Allowed roles (optional, e.g., ['admin', 'manager'])
 */
const ProtectedRoute = ({ children, module = null, roles = null }) => {
  const { currentUser, isActive, checkAccess, userRole } = useAuth();

  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user account is active (not blocked)
  if (!isActive()) {
    // User is blocked, logout will happen in AuthContext
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if roles are specified
  if (roles && roles.length > 0 && !roles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check module-level permission if module is specified
  if (module && !checkAccess(module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * App with Session Management
 * Wraps the app with session timeout functionality
 */
const AppWithSession = () => {
  const { showWarning, remainingTime, extendSession } = useSessionTimeout(30); // 30 minutes timeout

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* All users can access dashboard */}
            <Route index element={<Dashboard />} />

            {/* Project routes - Admin, Manager, Employee, Intern can read */}
            <Route path="projects" element={
              <ProtectedRoute module="projects">
                <Projects />
              </ProtectedRoute>
            } />

            {/* Sales routes - Admin, Manager can full access */}
            <Route path="sales" element={
              <ProtectedRoute module="sales">
                <Sales />
              </ProtectedRoute>
            } />

            {/* Telecalling - All except Intern can manage */}
            <Route path="telecalling" element={
              <ProtectedRoute module="telecalling">
                <Telecalling />
              </ProtectedRoute>
            } />

            {/* Employees - Admin full access, Manager read-only */}
            <Route path="employees" element={
              <ProtectedRoute module="employees" roles={['admin', 'manager']}>
                <Employees />
              </ProtectedRoute>
            } />

            {/* Expenses - Admin, Manager full access */}
            <Route path="expenses" element={
              <ProtectedRoute module="expenses">
                <Expenses />
              </ProtectedRoute>
            } />

            {/* Inventory */}
            <Route path="inventory" element={
              <ProtectedRoute module="inventory">
                <Inventory />
              </ProtectedRoute>
            } />

            {/* Internship */}
            <Route path="internship" element={
              <ProtectedRoute module="internship">
                <Internship />
              </ProtectedRoute>
            } />

            {/* Certificates */}
            <Route path="certificates" element={
              <ProtectedRoute module="certificates">
                <Certificates />
              </ProtectedRoute>
            } />

            {/* ID Cards */}
            <Route path="id-cards" element={
              <ProtectedRoute module="id-cards">
                <IDCards />
              </ProtectedRoute>
            } />

            {/* Documents */}
            <Route path="documents" element={
              <ProtectedRoute module="documents">
                <Documents />
              </ProtectedRoute>
            } />

            {/* Progress */}
            <Route path="progress" element={
              <ProtectedRoute module="progress">
                <Progress />
              </ProtectedRoute>
            } />

            {/* Tasks */}
            <Route path="tasks" element={
              <ProtectedRoute module="tasks">
                <Tasks />
              </ProtectedRoute>
            } />

            {/* Reports - Admin, Manager only */}
            <Route path="reports" element={
              <ProtectedRoute module="reports" roles={['admin', 'manager']}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Settings - Admin full access, Manager read-only */}
            <Route path="settings" element={
              <ProtectedRoute module="settings">
                <Settings />
              </ProtectedRoute>
            } />

            {/* Finance - Admin, Manager only */}
            <Route path="finance" element={
              <ProtectedRoute module="finance" roles={['admin', 'manager']}>
                <Finance />
              </ProtectedRoute>
            } />

            {/* User Management - Admin only */}
            <Route path="users" element={
              <ProtectedRoute module="user-management" roles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Session Warning Modal */}
      <SessionWarning
        showWarning={showWarning}
        remainingTime={remainingTime}
        onExtend={extendSession}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <OfflineIndicator />
      <AppWithSession />
    </AuthProvider>
  );
}

export default App;
