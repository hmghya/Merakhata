import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext.js';
// Fix: Added .js extension to imports
import { Notification } from '../../types.js';
import { ExclamationTriangleIcon, CalendarDaysIcon, TrashIcon } from '../Icons.js';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'lowStock':
            return <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />;
        case 'dueDate':
            return <CalendarDaysIcon className="h-6 w-6 text-sky-500" />;
        default:
            return null;
    }
};

// A utility to format time since the notification was created
const timeSince = (dateString: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    if (seconds < 10) return "just now";
    return Math.floor(seconds) + "s ago";
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useContext(AppContext);
  const { notifications } = state;
  
  if (!isOpen) return null;
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { id: notification.id } });
    }
    if (notification.link) {
      dispatch({ type: 'NAVIGATE', payload: { screen: notification.link.screen, payload: notification.link.payload } });
    }
    onClose();
  };
  
  const handleMarkAllRead = () => {
      dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  }
  
  const handleClearRead = () => {
      dispatch({ type: 'CLEAR_READ_NOTIFICATIONS' });
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true"></div>
      <div
        className="absolute top-16 right-4 w-80 max-w-[90vw] bg-white rounded-md shadow-lg z-40 ring-1 ring-black ring-opacity-5 animate-fade-in-scale flex flex-col"
        style={{ animationDuration: '100ms' }}
      >
        <div className="p-3 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-teal-600 hover:underline font-semibold">Mark all as read</button>
          )}
        </div>
        
        <div className="overflow-y-auto max-h-80">
          {notifications.length === 0 ? (
            <p className="text-slate-500 text-center p-6">You have no notifications.</p>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-3 p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${!notification.isRead ? 'bg-teal-50' : ''}`}
              >
                <div className="flex-shrink-0 mt-1">
                  <NotificationIcon type={notification.type} />
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-slate-700">{notification.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeSince(notification.timestamp)}</p>
                </div>
                {!notification.isRead && <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0 self-center"></div>}
              </div>
            ))
          )}
        </div>
        
        {notifications.some(n => n.isRead) && (
            <div className="p-2 border-t border-slate-200 text-center">
                <button onClick={handleClearRead} className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center justify-center gap-1 w-full p-1 rounded-md hover:bg-rose-50">
                   <TrashIcon className="h-3 w-3" /> Clear Read Notifications
                </button>
            </div>
        )}
      </div>
    </>
  );
};

export default NotificationsPanel;