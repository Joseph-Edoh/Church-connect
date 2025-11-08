
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import db from '../services/db';
import { MenuIcon } from './icons/MenuIcon';

interface HeaderProps {
    setSidebarOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { currentUser } = useAuth();
  const [churchName, setChurchName] = useState('Unknown Church');

  useEffect(() => {
    const fetchChurchName = async () => {
        if (currentUser) {
            try {
                const churches = await db.getChurches();
                const church = churches.find(c => c.id === currentUser.churchId);
                if (church) {
                    setChurchName(church.name);
                } else {
                    setChurchName('Unknown Church');
                }
            } catch (error) {
                console.error("Failed to fetch church name", error);
                setChurchName('Unknown Church');
            }
        }
    };
    fetchChurchName();
  }, [currentUser]);
  
  if (!currentUser) return null;

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none sm:hidden">
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="flex items-center">
        <div className="text-right">
            <p className="text-sm font-semibold text-dark-text">{currentUser.name}</p>
            <p className="text-xs text-light-text">{currentUser.role} at {churchName}</p>
        </div>
        <div className="ml-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
            {currentUser.name.charAt(0)}
        </div>
      </div>
    </header>
  );
};

export default Header;
