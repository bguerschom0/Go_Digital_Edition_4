import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { roleBasedNavigation } from './navigationConfig';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get navigation items based on user role
  const navigationItems = user ? roleBasedNavigation[user.role] || [] : [];

  // Check if a route is active
  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Check if a parent route is active based on its children
  const isActiveParent = (children) => {
    return children.some(child => isActiveRoute(child.path));
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      {/* Mobile close button */}
      <div className="md:hidden absolute top-0 right-0 p-4">
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
      </div>
      
      {/* Navigation */}
      <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          
          // Item with submenu
          if (item.children) {
            const isActive = isActiveParent(item.children);
            
            return (
              <div key={item.name} className="space-y-1">
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md 
                             ${isActive 
                                ? 'bg-black text-white dark:bg-white dark:text-black' 
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                >
                  <span className="flex items-center">
                    <Icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </span>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="pl-4 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = isActiveRoute(child.path);
                    
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={onClose}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          isChildActive
                            ? 'bg-gray-200 text-black dark:bg-gray-700 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <ChildIcon className="h-4 w-4 mr-2" />
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          
          // Simple navigation item
          const isActive = isActiveRoute(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5 mr-2" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
