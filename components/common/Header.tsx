import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../../context/AppContext.js';
// Fix: Added .js extension to imports
import { Screen } from '../../types.js';
import { ArrowLeftIcon, EllipsisVerticalIcon, BellIcon, MagnifyingGlassIcon, XMarkIcon } from '../Icons.js';
import SettingsMenu from './SettingsMenu.js';
import BackupRestoreModal from './BackupRestoreModal.js';
import RestoreModal from './RestoreModal.js';
import NotificationsPanel from './NotificationsPanel.js';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  backScreen?: Screen;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, backScreen }) => {
  const { state, dispatch } = useContext(AppContext);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const unreadCount = state.notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (isSearchOpen) {
      // A small delay ensures the element is visible before we try to focus it.
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backScreen) {
      dispatch({ type: 'NAVIGATE', payload: { screen: backScreen } });
    }
  };
  
  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleEditProfile = () => {
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.EditProfile } });
  };

  const handleAboutUs = () => {
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.AboutUs } });
  };

  const handleContactUs = () => {
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.ContactUs } });
  };
  
  const handlePrivacyPolicy = () => {
    dispatch({ type: 'NAVIGATE', payload: { screen: Screen.PrivacyPolicy } });
  };


  return (
    <>
      <div className="sticky top-0 z-20 no-print">
        <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-3 flex items-center justify-center relative shadow-md border-b border-cyan-700">
          {(onBack || backScreen) && (
              <div className="absolute left-4">
                  <button onClick={handleBack} className="p-2 rounded-full text-teal-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                  <ArrowLeftIcon className="h-6 w-6" />
                  </button>
              </div>
          )}
          
          <div className="flex items-center">
            <h1 className="text-base font-bold">{title}</h1>
          </div>
          
          <div className="absolute right-4 flex items-center gap-1">
              <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full text-teal-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  aria-label="Open search"
              >
                  <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
              <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative p-2 rounded-full text-teal-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  aria-label="Open notifications"
              >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-4 min-w-4 px-1 rounded-full text-xs font-medium bg-red-500 text-white ring-2 ring-cyan-600 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                  )}
              </button>
              <button
                  onClick={() => setIsSettingsMenuOpen(true)}
                  className="p-2 rounded-full text-teal-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  aria-label="Open settings menu"
                  id="menu-button"
                  aria-haspopup="true"
              >
                  <EllipsisVerticalIcon className="h-6 w-6" />
              </button>
          </div>
        </header>

        {isSearchOpen && (
          <div className="bg-white p-2 shadow-md border-b animate-slide-down">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search customers, items, bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                aria-label="Close search"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500 hover:text-slate-800" />
              </button>
            </div>
          </div>
        )}
      </div>

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <SettingsMenu
        isOpen={isSettingsMenuOpen}
        onClose={() => setIsSettingsMenuOpen(false)}
        onBackupClick={() => setIsBackupModalOpen(true)}
        onRestoreClick={() => setIsRestoreModalOpen(true)}
        onEditProfileClick={handleEditProfile}
        onAboutUsClick={handleAboutUs}
        onContactUsClick={handleContactUs}
        onPrivacyPolicyClick={handlePrivacyPolicy}
        onLogout={handleLogout}
      />
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
      />
    </>
  );
};

export default Header;