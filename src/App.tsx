import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './components/NotificationSystem';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { QuarterManagement } from './components/QuarterManagement';
import { FeeCollection } from './components/FeeCollection';
import { FeeStructureManagement } from './components/FeeStructureManagement';
import { ExtraChargeManagement } from './components/ExtraChargeManagement';
import { LateFeeConfiguration } from './components/LateFeeConfiguration';
import { Reports } from './components/Reports';
import { ParentPortal } from './components/ParentPortal';
import { EnhancedParentPortal } from './components/EnhancedParentPortal';
import { TransactionManagement } from './components/TransactionManagement';
import { BulkMessaging } from './components/BulkMessaging';
import Settings from './components/Settings';
import { PasswordReset } from './components/PasswordReset';

const AdminSection: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const currentSection = section || 'dashboard';

  const handleSectionChange = (newSection: string) => {
    navigate(`/admin/${newSection}`);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentManagement />;
      case 'quarters':
        return <QuarterManagement />;
      case 'fee-structures':
        return <FeeStructureManagement />;
      case 'extra-charges':
        return <ExtraChargeManagement />;
      case 'late-fee-config':
        return <LateFeeConfiguration />;
      case 'fee-collection':
        return <FeeCollection />;
      case 'transactions':
        return <TransactionManagement />;
      case 'reports':
        return <Reports />;
      case 'bulk-messaging':
        return <BulkMessaging />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      currentSection={currentSection} 
      onSectionChange={handleSectionChange}
    >
      {renderSection()}
    </Layout>
  );
};

const AdminApp: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    setIsRecoveryMode(type === 'recovery');
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isRecoveryMode) {
    return <PasswordReset />;
  }

  if (!user) {
    return <LoginForm />;
  }

  return <AdminSection />;
};

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ParentPortal />} />
          <Route path="/parent-portal" element={<AuthProvider><EnhancedParentPortal /></AuthProvider>} />
          <Route path="/admin" element={<AuthProvider><Navigate to="/admin/dashboard" replace /></AuthProvider>} />
          <Route path="/admin/:section" element={<AuthProvider><AdminApp /></AuthProvider>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;