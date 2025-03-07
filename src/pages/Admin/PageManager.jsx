import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const PageManager = () => {
  // State to store all pages
  const [pages, setPages] = useState([]);
  // State to track pages marked for deletion
  const [pagesToDelete, setPagesToDelete] = useState([]);
  // State to track if we're in deletion mode
  const [deleteMode, setDeleteMode] = useState(false);
  // State to track if we're showing confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);
  // State to track filtering
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const { user } = useAuth();

  // Generate page data based on your app's routes
  useEffect(() => {
    // This data is based on your route structure
    const appPages = [
      // Dashboard Pages
      { id: 1, name: 'Admin Dashboard', path: '/admindashboard', roles: ['administrator'], category: 'Dashboard', status: 'active' },
      { id: 2, name: 'User Dashboard', path: '/userdashboard', roles: ['administrator', 'user'], category: 'Dashboard', status: 'active' },
      { id: 3, name: 'Organization Dashboard', path: '/orgdashboard', roles: ['administrator', 'organization'], category: 'Dashboard', status: 'active' },
      
      // User Management
      { id: 4, name: 'User Management', path: '/user-management', roles: ['administrator'], category: 'Users', status: 'active' },
      
      // Request Pages
      { id: 5, name: 'Request List', path: '/requests', roles: ['administrator', 'user', 'organization'], category: 'Requests', status: 'active' },
      { id: 6, name: 'Request Detail', path: '/requests/:id', roles: ['administrator', 'user', 'organization'], category: 'Requests', status: 'active' },
      { id: 7, name: 'New Request', path: '/requests/new', roles: ['administrator', 'user'], category: 'Requests', status: 'active' },
      
      // Organization Pages
      { id: 8, name: 'Organization List', path: '/organizations', roles: ['administrator'], category: 'Organizations', status: 'active' },
      { id: 9, name: 'Organization Users', path: '/organizations/users', roles: ['administrator'], category: 'Organizations', status: 'active' },
      { id: 10, name: 'Organization Detail', path: '/organizations/:id', roles: ['administrator'], category: 'Organizations', status: 'active' },
      { id: 11, name: 'Organization Profile', path: '/organization-profile', roles: ['administrator', 'organization'], category: 'Organizations', status: 'active' },
      
      // Report Pages
      { id: 12, name: 'Request Reports', path: '/reports/requests', roles: ['administrator', 'user'], category: 'Reports', status: 'active' },
      { id: 13, name: 'Performance Reports', path: '/reports/performance', roles: ['administrator'], category: 'Reports', status: 'active' },
      { id: 14, name: 'Organization Reports', path: '/reports/organizations', roles: ['administrator', 'user'], category: 'Reports', status: 'active' },
      { id: 15, name: 'Custom Reports', path: '/reports/custom', roles: ['administrator'], category: 'Reports', status: 'active' },
      
      // Other Pages
      { id: 16, name: 'Notification Center', path: '/notifications', roles: ['administrator', 'organization'], category: 'Misc', status: 'active' },
      { id: 17, name: 'Contact', path: '/contact', roles: ['administrator', 'organization'], category: 'Misc', status: 'active' },
      { id: 18, name: 'Login', path: '/login', roles: ['public'], category: 'Auth', status: 'active' },
      { id: 19, name: 'Unauthorized', path: '/unauthorized', roles: ['public'], category: 'Auth', status: 'active' },
      
      // Legacy/Unused Pages (examples - you would customize these)
      { id: 20, name: 'Old Admin Panel', path: '/admin-panel', roles: ['administrator'], category: 'Legacy', status: 'unused' },
      { id: 21, name: 'Old User Profile', path: '/profile', roles: ['administrator', 'user', 'organization'], category: 'Legacy', status: 'unused' },
      { id: 22, name: 'Legacy Reports', path: '/legacy-reports', roles: ['administrator'], category: 'Legacy', status: 'unused' },
      { id: 23, name: 'Beta Dashboard', path: '/beta-dashboard', roles: ['administrator'], category: 'Development', status: 'development' },
    ];
    
    setPages(appPages);
  }, []);

  // Toggle a page for deletion
  const togglePageForDeletion = (pageId) => {
    if (pagesToDelete.includes(pageId)) {
      setPagesToDelete(pagesToDelete.filter(id => id !== pageId));
    } else {
      setPagesToDelete([...pagesToDelete, pageId]);
    }
  };

  // Handle deletion of selected pages
  const handleDeletePages = () => {
    // In a real app, you would remove these pages from your routing
    console.log('Pages to delete:', pagesToDelete);
    
    // Update the list to remove deleted pages
    const remainingPages = pages.filter(page => !pagesToDelete.includes(page.id));
    setPages(remainingPages);
    setPagesToDelete([]);
    setShowConfirmation(false);
    setDeleteMode(false);
  };

  // Handle sorting change
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort pages
  const filteredAndSortedPages = pages
    .filter(page => {
      // Role filter
      if (roleFilter !== 'all' && !page.roles.includes(roleFilter)) {
        return false;
      }
      
      // Search filter
      if (searchTerm && !page.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !page.path.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'path') {
        comparison = a.path.localeCompare(b.path);
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Get available roles from pages
  const allRoles = ['all', ...new Set(pages.flatMap(page => page.roles))];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Page Manager</h1>
      
      <div className="mb-6 bg-white p-4 rounded shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by role:
              </label>
              <select
                id="roleFilter"
                className="border rounded p-2 w-full"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                {allRoles.map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                Search pages:
              </label>
              <input
                id="searchTerm"
                type="text"
                className="border rounded p-2 w-full"
                placeholder="Search by name or path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button
              className={`px-4 py-2 rounded ${deleteMode ? 'bg-gray-500 text-white' : 'bg-red-500 text-white'}`}
              onClick={() => setDeleteMode(!deleteMode)}
            >
              {deleteMode ? 'Cancel' : 'Select Pages to Delete'}
            </button>
            
            {deleteMode && (
              <button
                className="ml-2 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                disabled={pagesToDelete.length === 0}
                onClick={() => setShowConfirmation(true)}
              >
                Delete Selected ({pagesToDelete.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredAndSortedPages.length > 0 ? (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 text-left">
                {deleteMode && <th className="py-3 px-4 border-b">Select</th>}
                <th 
                  className="py-3 px-4 border-b cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Page Name
                    {sortBy === 'name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 border-b cursor-pointer"
                  onClick={() => handleSort('path')}
                >
                  <div className="flex items-center">
                    Path
                    {sortBy === 'path' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 border-b cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Category
                    {sortBy === 'category' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 border-b">Access Roles</th>
                <th 
                  className="py-3 px-4 border-b cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortBy === 'status' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPages.map((page) => (
                <tr 
                  key={page.id} 
                  className={`hover:bg-gray-50 ${pagesToDelete.includes(page.id) ? 'bg-red-50' : ''}`}
                >
                  {deleteMode && (
                    <td className="py-3 px-4 border-b">
                      <input
                        type="checkbox"
                        checked={pagesToDelete.includes(page.id)}
                        onChange={() => togglePageForDeletion(page.id)}
                        className="h-5 w-5"
                      />
                    </td>
                  )}
                  <td className="py-3 px-4 border-b font-medium">{page.name}</td>
                  <td className="py-3 px-4 border-b text-gray-500">{page.path}</td>
                  <td className="py-3 px-4 border-b">{page.category}</td>
                  <td className="py-3 px-4 border-b">
                    <div className="flex flex-wrap gap-1">
                      {page.roles.map(role => (
                        <span 
                          key={`${page.id}-${role}`} 
                          className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      page.status === 'active' ? 'bg-green-100 text-green-800' : 
                      page.status === 'unused' ? 'bg-red-100 text-red-800' : 
                      page.status === 'development' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {page.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded shadow">
          <p className="text-gray-600">No pages match your filter criteria</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">
              Are you sure you want to delete these {pagesToDelete.length} pages?
            </p>
            <div className="max-h-40 overflow-y-auto mb-4">
              <ul className="list-disc pl-5">
                {pagesToDelete.map(id => {
                  const page = pages.find(p => p.id === id);
                  return page ? (
                    <li key={id} className="mb-1">
                      {page.name} <span className="text-gray-500">({page.path})</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
            <p className="text-red-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={handleDeletePages}
              >
                Delete Pages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManager;
