import React from 'react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onBackupClick: () => void;
  onRestoreClick: () => void;
  onEditProfileClick: () => void;
  onAboutUsClick: () => void;
  onContactUsClick: () => void;
  onPrivacyPolicyClick: () => void;
  onLogout: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
    isOpen, onClose, onBackupClick, onRestoreClick, onEditProfileClick, onAboutUsClick, onContactUsClick, onPrivacyPolicyClick, onLogout 
}) => {
  if (!isOpen) return null;

  const menuItems = [
    'Backup data',
    'Restore data',
    'Edit Profile',
    'About Us',
    'Contact Us',
    'Privacy policy',
    'Log out',
  ];

  const handleItemClick = (item: string) => {
    switch(item) {
        case 'Backup data':
            onBackupClick();
            break;
        case 'Restore data':
            onRestoreClick();
            break;
        case 'Edit Profile':
            onEditProfileClick();
            break;
        case 'About Us':
            onAboutUsClick();
            break;
        case 'Contact Us':
            onContactUsClick();
            break;
        case 'Privacy policy':
            onPrivacyPolicyClick();
            break;
        case 'Log out':
            onLogout();
            break;
        default:
            console.log(`${item} clicked`);
            break;
    }
    onClose(); // Close main settings menu
  };

  return (
    <>
      {/* Overlay to catch clicks outside the menu */}
      <div 
        className="fixed inset-0 z-20" 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* Menu Panel */}
      <div
        className="absolute top-16 right-4 w-56 bg-white rounded-md shadow-lg z-30 ring-1 ring-black ring-opacity-5 animate-fade-in-scale"
        style={{ animationDuration: '100ms' }}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
      >
        <div className="py-1" role="none">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => handleItemClick(item)}
              className="text-slate-700 block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default SettingsMenu;