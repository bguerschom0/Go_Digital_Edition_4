import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    onDelete(notification.id);
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {!notification.is_read ? (
            <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
          ) : (
            <div className="w-2 h-2 mt-1.5 bg-transparent"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </p>
            <div className="flex items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {notification.message}
          </p>
          {notification.related_request_id && (
            <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>View related request</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
