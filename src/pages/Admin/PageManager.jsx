import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const PageManager = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagesToDelete, setPagesToDelete] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('usage');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();

  // GitHub repository scanner - this would be replaced with actual GitHub API calls
  useEffect(() => {
    const scanRepository = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would be an API call to scan your GitHub repo
        // For now, we'll simulate the analysis based on the routes in your App.js
        
        // This would normally come from a backend service that analyzes your repo
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network request
        
        // This data would come from analyzing your GitHub repo content
        const analyzedPages = [
          // Active pages from your App.js
          { 
            id: 'login', 
            path: '/login', 
            component: 'LoginPage',
            filePath: 'src/pages/Login/Login.jsx',
            lastModified: '2024-02-15',
            usageCount: 150,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth'],
            recommended: 'keep',
            usedBy: ['public'],
            reason: 'Critical authentication component'
          },
          { 
            id: 'adminDashboard', 
            path: '/admindashboard', 
            component: 'AdminDashboard',
            filePath: 'src/pages/dashboard/AdminDashboard.jsx',
            lastModified: '2024-02-10',
            usageCount: 87,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['administrator'],
            reason: 'Active admin interface'
          },
          { 
            id: 'userDashboard', 
            path: '/userdashboard', 
            component: 'UserDashboard',
            filePath: 'src/pages/dashboard/UserDashboard.jsx',
            lastModified: '2024-02-12',
            usageCount: 134,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['user', 'administrator'],
            reason: 'Active user interface'
          },
          { 
            id: 'orgDashboard', 
            path: '/orgdashboard', 
            component: 'OrgDashboard',
            filePath: 'src/pages/dashboard/OrgDashboard.jsx',
            lastModified: '2024-02-11',
            usageCount: 76,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['organization', 'administrator'],
            reason: 'Active organization interface'
          },
          { 
            id: 'userManagement', 
            path: '/user-management', 
            component: 'UserManagement',
            filePath: 'src/pages/UserManagement/UserManagement.jsx',
            lastModified: '2024-02-05',
            usageCount: 42,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['administrator'],
            reason: 'Active admin tool'
          },
          
          // More active pages
          { 
            id: 'requestList', 
            path: '/requests', 
            component: 'RequestList',
            filePath: 'src/pages/requests/RequestList.jsx',
            lastModified: '2024-02-08',
            usageCount: 120,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['all authenticated'],
            reason: 'Core functionality'
          },
          { 
            id: 'requestDetail', 
            path: '/requests/:id', 
            component: 'RequestDetail',
            filePath: 'src/pages/requests/RequestDetail.jsx',
            lastModified: '2024-02-07',
            usageCount: 95,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['all authenticated'],
            reason: 'Core functionality'
          },
          { 
            id: 'newRequest', 
            path: '/requests/new', 
            component: 'NewRequest',
            filePath: 'src/pages/requests/NewRequest.jsx',
            lastModified: '2024-02-06',
            usageCount: 67,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['administrator', 'user'],
            reason: 'Core functionality'
          },
          
          // Organization pages
          { 
            id: 'organizationList', 
            path: '/organizations', 
            component: 'OrganizationList',
            filePath: 'src/pages/organizations/OrganizationList.jsx',
            lastModified: '2024-02-04',
            usageCount: 38,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['administrator'],
            reason: 'Active admin tool'
          },
          { 
            id: 'organizationUsers', 
            path: '/organizations/users', 
            component: 'OrganizationUsers',
            filePath: 'src/pages/organizations/OrganizationUsers.jsx',
            lastModified: '2024-02-03',
            usageCount: 29,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['administrator'],
            reason: 'Active admin tool'
          },
          
          // Report pages
          { 
            id: 'requestReports', 
            path: '/reports/requests', 
            component: 'RequestReports',
            filePath: 'src/pages/reports/RequestReports.jsx',
            lastModified: '2024-02-01',
            usageCount: 45,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'keep',
            usedBy: ['administrator', 'user'],
            reason: 'Active reporting tool'
          },
          
          // Legacy/unused pages
          { 
            id: 'oldUserProfile', 
            path: '/profile-old', 
            component: 'UserProfile',
            filePath: 'src/pages/UserProfile.jsx', // Not in a subfolder, old structure
            lastModified: '2023-05-15', // Old modification date
            usageCount: 3,
            deploymentStatus: 'deployed',
            dependencies: ['deprecated-auth-hook'],
            recommended: 'delete',
            usedBy: ['none'],
            reason: 'Superseded by new user management'
          },
          { 
            id: 'betaFeatures', 
            path: '/beta-features', 
            component: 'BetaFeatures',
            filePath: 'src/pages/beta/BetaFeatures.jsx',
            lastModified: '2023-08-10',
            usageCount: 0,
            deploymentStatus: 'deployed',
            dependencies: ['experimental-ui'],
            recommended: 'delete',
            usedBy: ['none'],
            reason: 'Beta features now in production'
          },
          { 
            id: 'v1Reports', 
            path: '/v1/reports', 
            component: 'OldReports',
            filePath: 'src/pages/v1/Reports.jsx',
            lastModified: '2023-04-22',
            usageCount: 2,
            deploymentStatus: 'deployed',
            dependencies: ['old-charts-lib'],
            recommended: 'delete',
            usedBy: ['none'],
            reason: 'Replaced by new reports module'
          },
          
          // Duplicate functionality
          { 
            id: 'tempAdminPanel', 
            path: '/temp-admin', 
            component: 'TempAdminPanel',
            filePath: 'src/pages/admin/TempAdminPanel.jsx',
            lastModified: '2023-12-01',
            usageCount: 5,
            deploymentStatus: 'deployed',
            dependencies: ['useAuth', 'supabase'],
            recommended: 'delete',
            usedBy: ['administrator'],
            reason: 'Temporary admin panel now redundant'
          },
          
          // Development/staging pages
          { 
            id: 'newFeaturePreview', 
            path: '/preview/new-feature', 
            component: 'NewFeaturePreview',
            filePath: 'src/pages/preview/NewFeaturePreview.jsx',
            lastModified: '2024-01-15',
            usageCount: 11,
            deploymentStatus: 'development',
            dependencies: ['useAuth', 'experimental-hooks'],
            recommended: 'review',
            usedBy: ['administrator'],
            reason: 'Development preview - move to production or delete'
          }
        ];
        
        setPages(analyzedPages);
        setLoading(false);
      } catch (err) {
        console.error('Error scanning repository:', err);
        setError('Failed to scan repository. Please check console for details.');
        setLoading(false);
      }
    };

    scanRepository();
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
  const handleDeletePages = async () => {
    try {
      setLoading(true);
      
      // This would connect to GitHub API to delete files
      // For now, just simulate the process
      
      // In a real implementation, you would:
      // 1. Create a commit to GitHub that removes these files
      // 2. Trigger a new Vercel deployment
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API request
      
      // Update the UI to remove deleted pages
      setPages(pages.filter(page => !pagesToDelete.includes(page.id)));
      setPagesToDelete([]);
      setShowConfirmation(false);
      setDeleteMode(false);
      setLoading(false);
    } catch (err) {
      console.error('Error deleting pages:', err);
      setError('Failed to delete pages. Please check console for details.');
      setLoading(false);
    }
  };
  
  // Apply sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Filter pages based on current criteria
  const filteredPages = pages.filter(page => {
    // Filter by recommendation
    if (filterType !== 'all' && page.recommended !== filterType) {
      return false;
    }
    
    // Search filter
    if (searchTerm && !page.path.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !page.component.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !page.filePath.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort filtered pages
  const sortedPages = [...filteredPages].sort((a, b) => {
    let comparison = 0;
    
    switch(sortBy) {
      case 'path':
        comparison = a.path.localeCompare(b.path);
        break;
      case 'component':
        comparison = a.component.localeCompare(b.component);
        break;
      case 'lastModified':
        comparison = new Date(b.lastModified) - new Date(a.lastModified);
        break;
      case 'usage':
        comparison = b.usageCount - a.usageCount;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Determine counts for each category
  const pageCounts = {
    keep: pages.filter(page => page.recommended === 'keep').length,
    delete: pages.filter(page => page.recommended === 'delete').length,
    review: pages.filter(page => page.recommended === 'review').length
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg">Scanning repository and analyzing pages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Page Manager</h1>
      <p className="text-gray-600 mb-6">
        Repository analysis complete. Found {pages.length} pages in your GitHub repository.
      </p>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Total Pages</h2>
          <p className="text-3xl font-bold">{pages.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded shadow border-l-4 border-green-500">
          <h2 className="text-lg font-semibold mb-2">Keep</h2>
          <p className="text-3xl font-bold text-green-600">{pageCounts.keep}</p>
        </div>
        <div className="bg-red-50 p-4 rounded shadow border-l-4 border-red-500">
          <h2 className="text-lg font-semibold mb-2">Delete</h2>
          <p className="text-3xl font-bold text-red-600">{pageCounts.delete}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded shadow border-l-4 border-yellow-500">
          <h2 className="text-lg font-semibold mb-2">Review</h2>
          <p className="text-3xl font-bold text-yellow-600">{pageCounts.review}</p>
        </div>
      </div>
      
      {/* Filters and controls */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div>
              <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">
                Show:
              </label>
              <select
                id="filterType"
                className="border rounded p-2 w-full"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Pages</option>
                <option value="keep">Recommended to Keep</option>
                <option value="delete">Recommended to Delete</option>
                <option value="review">Needs Review</option>
              </select>
            </div>
            
            <div className="flex-grow">
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                Search:
              </label>
              <input
                id="searchTerm"
                type="text"
                className="border rounded p-2 w-full"
                placeholder="Search by path, component or file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <button
              className={`w-full md:w-auto px-4 py-2 rounded ${deleteMode ? 'bg-gray-500 text-white' : 'bg-red-500 text-white'}`}
              onClick={() => setDeleteMode(!deleteMode)}
            >
              {deleteMode ? 'Cancel' : 'Select Pages to Delete'}
            </button>
            
            {deleteMode && (
              <button
                className="w-full md:w-auto mt-2 md:mt-0 md:ml-2 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                disabled={pagesToDelete.length === 0}
                onClick={() => setShowConfirmation(true)}
              >
                Delete Selected ({pagesToDelete.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pages table */}
      {sortedPages.length > 0 ? (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                {deleteMode && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>}
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('component')}
                >
                  <div className="flex items-center">
                    Component
                    {sortBy === 'component' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('path')}
                >
                  <div className="flex items-center">
                    Path
                    {sortBy === 'path' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Path
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lastModified')}
                >
                  <div className="flex items-center">
                    Last Modified
                    {sortBy === 'lastModified' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('usage')}
                >
                  <div className="flex items-center">
                    Usage
                    {sortBy === 'usage' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommendation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPages.map((page) => (
                <tr 
                  key={page.id} 
                  className={`hover:bg-gray-50 ${pagesToDelete.includes(page.id) ? 'bg-red-50' : ''}`}
                >
                  {deleteMode && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={pagesToDelete.includes(page.id)}
                        onChange={() => togglePageForDeletion(page.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.component}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.path}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.filePath}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.lastModified}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {page.usageCount}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      page.recommended === 'keep' ? 'bg-green-100 text-green-800' : 
                      page.recommended === 'delete' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {page.recommended}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{page.reason}</div>
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

      {/* GitHub integration info */}
      <div className="mt-6 bg-blue-50 p-4 rounded shadow border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">GitHub Integration</h3>
        <p className="text-sm text-blue-700 mb-2">
          To fully implement this Page Manager with your GitHub repository, you'll need to:
        </p>
        <ol className="list-decimal pl-5 text-sm text-blue-700">
          <li className="mb-1">Create a GitHub Personal Access Token with repo permissions</li>
          <li className="mb-1">Add the token to your environment variables</li>
          <li className="mb-1">Replace the mock data with actual GitHub API calls</li>
          <li className="mb-1">Connect with Vercel analytics to track page usage</li>
        </ol>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">
              Are you sure you want to delete these {pagesToDelete.length} pages from your repository?
            </p>
            <div className="max-h-40 overflow-y-auto mb-4 border rounded p-2">
              <ul className="list-disc pl-5">
                {pagesToDelete.map(id => {
                  const page = pages.find(p => p.id === id);
                  return page ? (
                    <li key={id} className="mb-1">
                      <span className="font-medium">{page.component}</span> 
                      <span className="text-gray-500"> ({page.filePath})</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
            <p className="text-red-600 text-sm mb-4">
              This will delete these files from your GitHub repository. This action cannot be undone.
            </p>
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
                Delete Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManager;
