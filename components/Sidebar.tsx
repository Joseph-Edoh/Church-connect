
import React from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { HomeIcon, CogIcon, ClipboardListIcon, DocumentReportIcon, UserAddIcon, LogoutIcon, XIcon, UsersIcon } from './icons';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isSidebarOpen, setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const navItems = [
    { name: 'Announcements', icon: <HomeIcon className="w-6 h-6" />, roles: [UserRole.SuperAdmin, UserRole.UnitHead, UserRole.FirstTimerLogger, UserRole.GeneralMember] },
    { name: 'Configuration', icon: <CogIcon className="w-6 h-6" />, roles: [UserRole.SuperAdmin] },
    { name: 'Unit Action Plan', icon: <ClipboardListIcon className="w-6 h-6" />, roles: [UserRole.SuperAdmin, UserRole.UnitHead] },
    { name: 'Unit Reports', icon: <DocumentReportIcon className="w-6 h-6" />, roles: [UserRole.SuperAdmin, UserRole.UnitHead] },
    { name: 'First-Timers', icon: <UserAddIcon className="w-6 h-6" />, roles: [UserRole.SuperAdmin, UserRole.FirstTimerLogger] },
  ];

  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    if(window.innerWidth < 640) {
        setSidebarOpen(false);
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-700">
            <div className="flex items-center">
                <UsersIcon className="w-8 h-8 text-white mr-2" />
                <span className="text-white text-lg font-semibold">ChurchConnect</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="sm:hidden text-white">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        <nav className="flex-1 mt-6">
            {navItems.map((item) =>
            item.roles.includes(currentUser.role) && (
                <a
                key={item.name}
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.name);
                }}
                className={`flex items-center px-4 py-3 mx-2 my-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentPage === item.name
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                }`}
                >
                {item.icon}
                <span className="ml-4">{item.name}</span>
                </a>
            )
            )}
        </nav>
        <div className="p-4 border-t border-blue-700">
            <button onClick={logout} className="w-full flex items-center px-4 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-600 hover:text-white transition-colors duration-200">
                <LogoutIcon className="w-6 h-6"/>
                <span className="ml-4">Logout</span>
            </button>
        </div>
    </div>
  );

  return (
    <>
        {/* Mobile overlay */}
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-20 sm:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <aside className={`fixed sm:relative inset-y-0 left-0 w-64 bg-primary text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 transition-transform duration-300 ease-in-out z-30`}>
            {sidebarContent}
        </aside>
    </>
  );
};

export default Sidebar;
