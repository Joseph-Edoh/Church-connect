
import React, { useState, createContext, useContext, useMemo } from 'react';
import { User, UserRole } from './types';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Announcements from './pages/Announcements';
import Configuration from './pages/Configuration';
import UnitActionPlan from './pages/UnitActionPlan';
import UnitReports from './pages/UnitReports';
import FirstTimers from './pages/FirstTimers';
import { HomeIcon } from './components/icons/HomeIcon';

interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('Announcements');
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const login = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('Announcements'); // Default page after login
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const authContextValue = useMemo(() => ({ currentUser, login, logout }), [currentUser]);

  const renderPage = () => {
    if (!currentUser) return null;
    switch (currentPage) {
      case 'Announcements':
        return <Announcements />;
      case 'Configuration':
        return currentUser.role === UserRole.SuperAdmin ? <Configuration /> : <AccessDenied />;
      case 'Unit Action Plan':
        return currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.UnitHead ? <UnitActionPlan /> : <AccessDenied />;
      case 'Unit Reports':
        return currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.UnitHead ? <UnitReports /> : <AccessDenied />;
      case 'First-Timers':
        return currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.FirstTimerLogger ? <FirstTimers /> : <AccessDenied />;
      default:
        return <Announcements />;
    }
  };

  if (!currentUser) {
    return (
      <AuthContext.Provider value={authContextValue}>
        <LoginScreen />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4 sm:p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
};

const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-md p-8">
        <HomeIcon className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-dark-text mb-2">Access Denied</h2>
        <p className="text-light-text text-center">You do not have permission to view this page. Please contact your administrator if you believe this is an error.</p>
    </div>
);


export default App;
