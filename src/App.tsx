import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './components/NotificationSystem';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { ClassManagement } from './components/ClassManagement';
import { QuarterManagement } from './components/QuarterManagement';
import { FeeCollection } from './components/FeeCollection';
import { FeeStructureManagement } from './components/FeeStructureManagement';
import { ExtraChargeManagement } from './components/ExtraChargeManagement';
import { LateFeeConfiguration } from './components/LateFeeConfiguration';
import { Reports } from './components/Reports';
import { ParentPortal } from './components/ParentPortal';
import { TransactionManagement } from './components/TransactionManagement';
import { Settings } from './components/Settings';

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
      case 'classes':
        return <ClassManagement />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
          <Route path="/admin" element={<AuthProvider><Navigate to="/admin/dashboard" replace /></AuthProvider>} />
          <Route path="/admin/:section" element={<AuthProvider><AdminApp /></AuthProvider>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;