import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Calendar,
  Receipt,
  DollarSign,
  Calculator,
  Plus,
  AlertTriangle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentSection, 
  onSectionChange 
}) => {
  const { user, signOut } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'cashier'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['admin', 'cashier'] },
    { id: 'quarters', label: 'Quarters', icon: Calendar, roles: ['admin'] },
    { id: 'fee-structures', label: 'Fee Structures', icon: DollarSign, roles: ['admin'] },
    { id: 'extra-charges', label: 'Extra Charges', icon: Plus, roles: ['admin'] },
    { id: 'late-fee-config', label: 'Late Fee Config', icon: AlertTriangle, roles: ['admin'] },
    { id: 'fee-collection', label: 'Fee Collection', icon: Calculator, roles: ['admin', 'cashier'] },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, roles: ['admin', 'cashier'] },
    { id: 'reports', label: 'Reports', icon: Receipt, roles: ['admin', 'cashier'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/Colorful Fun Illustration Kids Summer Camp Activity Flyer.png" 
                alt="J.R. Preparatory School Logo" 
                className="w-12 h-12 rounded-lg object-contain bg-white p-1"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">J.R. Preparatory School</h1>
                <p className="text-sm text-gray-600">Puranpur - Fee Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
              
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};