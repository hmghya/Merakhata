import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext.js';
// Fix: Added .js extension to imports
import { Screen } from '../../types.js';
import { HomeIcon, UsersIcon, TruckIcon, BookOpenIcon, ArchiveIcon } from '../Icons.js';

interface FooterProps {
  currentScreen: Screen;
}

const Footer: React.FC<FooterProps> = ({ currentScreen }) => {
  const { dispatch } = useContext(AppContext);

  const navigateTo = (screen: Screen) => {
    if (screen !== currentScreen) {
      dispatch({ type: 'NAVIGATE', payload: { screen } });
    }
  };

  const navItems = [
    { screen: Screen.Home, label: 'Home', icon: HomeIcon },
    { screen: Screen.Customers, label: 'Customers', icon: UsersIcon },
    { screen: Screen.Suppliers, label: 'Suppliers', icon: TruckIcon },
    { screen: Screen.DayBook, label: 'Day Book', icon: BookOpenIcon },
    { screen: Screen.StockBook, label: 'Stock', icon: ArchiveIcon },
  ];

  return (
    <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-gradient-to-r from-teal-700 to-cyan-700 border-t border-cyan-800 shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)] z-20">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigateTo(item.screen)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-cyan-300 hover:text-white'
              }`}
            >
              <Icon className="h-7 w-7 mb-0.5" />
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};

export default Footer;