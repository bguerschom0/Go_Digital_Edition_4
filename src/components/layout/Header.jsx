import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Moon, Sun, ChevronDown, User, LogOut, Menu, X, UserCircle } from 'lucide-react';
import { roleBasedNavigation } from './navigationConfig';
import { Dialog, DialogContent } from '../ui/dialog';
import { getRoleBasedDashboard } from '../../utils/roleRoutes';
import NotificationBell from '../notifications/NotificationBell';

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Get navigation items based on the user's role
  const navigationItems = user ? roleBasedNavigation[user.role] || [] : [];

  // Handle click outside dropdown and submenus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    try {
      logout();
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (user) {
      const dashboardPath = getRoleBasedDashboard(user.role);
      navigate(dashboardPath);
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (localStorage.getItem('darkMode') === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Helper function to display role name
  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'administrator':
        return 'Administrator';
      case 'organization':
        return 'Organization';
      case 'user':
        return 'User';
      default:
        return role;
    }
  };

  return (
    <>
      <header className="bg-gray-50 dark:bg-gray-900 shadow-sm mt-0">
        <div className="max-w-full px-4 py-2">
          <div className="flex justify-between items-center">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-auto cursor-pointer" 
              onClick={handleLogoClick}
            />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center" ref={menuRef}>
              <nav className="flex items-center space-x-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return item.children ? (
                    <div 
                      key={item.name}
                      className="relative"
                      onMouseEnter={() => setOpenSubmenu(item.name)}
                      onMouseLeave={() => setOpenSubmenu(null)}
                    >
                      <button className="flex items-center px-3 py-2 rounded-md text-sm font-medium 
                                       text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 
                                       transition-colors whitespace-nowrap">
                        <Icon className="h-4 w-4 mr-2" />
                        {item.name}
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </button>
                      {openSubmenu === item.name && (
                        <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                className="flex items-center px-4 py-2 text-sm text-gray-900 dark:text-gray-100 
                                         hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <ChildIcon className="h-4 w-4 mr-2" />
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium 
                               text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 
                               transition-colors whitespace-nowrap"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Desktop User Menu and Notifications */}
            {user && (
              <div className="hidden md:flex items-center space-x-4">
                <NotificationBell />
                
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2"
                  >
                    <div className="bg-gray-300 dark:bg-gray-600 rounded-full p-2">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.full_name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-300 dark:bg-gray-600 rounded-full p-3">
                            <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleDisplayName(user.role)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={handleProfileClick}
                          className="flex items-center w-full text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-2 py-2"
                        >
                          <User className="h-4 w-4 mr-2" />
                          My Profile
                        </button>
                        <button
                          onClick={toggleDarkMode}
                          className="flex items-center w-full text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-2 py-2"
                        >
                          {isDarkMode ? (
                            <Sun className="h-4 w-4 mr-2" />
                          ) : (
                            <Moon className="h-4 w-4 mr-2" />
                          )}
                          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-6 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-300 dark:bg-gray-600 rounded-full p-3">
                    <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user ? getRoleDisplayName(user.role) : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return item.children ? (
                    <div key={item.name} className="space-y-2">
                      <button
                        onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                        className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium 
                                 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.name}
                        <ChevronDown className={`h-4 w-4 ml-auto transform transition-transform ${
                          openSubmenu === item.name ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {openSubmenu === item.name && (
                        <div className="pl-4 space-y-2">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center px-3 py-2 rounded-md text-sm text-gray-900 
                                         dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <ChildIcon className="h-4 w-4 mr-2" />
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium 
                               text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/notifications');
                    }}
                    className="flex items-center w-full px-3 py-2 rounded-md text-sm text-gray-900 
                             dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <NotificationBell isMobile={true} />
                    <span className="ml-2">Notifications</span>
                  </button>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center w-full px-3 py-2 rounded-md text-sm text-gray-900 
                           dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center w-full px-3 py-2 mt-2 rounded-md text-sm text-gray-900 
                           dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 mr-2" />
                  ) : (
                    <Moon className="h-4 w-4 mr-2" />
                  )}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-3 py-2 mt-2 rounded-md text-sm text-gray-900 
                           dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 gap-0">
          <div className="flex flex-col">
            {/* Profile Header with Avatar */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-t-lg">
              <div className="flex flex-col items-center">
                <div className="bg-white dark:bg-gray-700 rounded-full p-4 shadow-sm">
                  <UserCircle className="h-20 w-20 text-gray-400 dark:text-gray-300" />
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="p-6 space-y-4">
              {/* Full Name */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {user?.full_name}
                </h2>
              </div>

              {/* Info Grid */}
              <div className="space-y-3">
                {/* Username */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Username</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.username}
                  </span>
                </div>

                {/* Role */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user ? getRoleDisplayName(user.role) : ''}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full ${
                      Boolean(user?.is_active) === false ? 'bg-red-500' : 'bg-green-500'
                    } mr-2`} />
                    <span className={`text-sm font-medium ${
                      Boolean(user?.is_active) === false
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {Boolean(user?.is_active) === false ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
