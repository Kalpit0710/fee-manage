import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { ClassManagement } from './components/ClassManagement';
import { QuarterManagement } from './components/QuarterManagement';
import { FeeCollection } from './components/FeeCollection';
import { Reports } from './components/Reports';
import { ParentPortal } from './components/ParentPortal';

const AdminApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentSection, setCurrentSection] = useState('dashboard');

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
        return <div>Fee Structures Management (Coming Soon)</div>;
      case 'fee-collection':
        return <FeeCollection />;
      case 'transactions':
        return <div>Transactions Management (Coming Soon)</div>;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <div>Settings (Coming Soon)</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      currentSection={currentSection} 
      onSectionChange={setCurrentSection}
    >
      {renderSection()}
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthProvider><AdminApp /></AuthProvider>} />
        <Route path="/parent-portal" element={<ParentPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;