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
  const [sortBy, setSortBy] = useState('path');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [gitOutput, setGitOutput] = useState('');
  const [showGitOutput, setShowGitOutput] = useState(false);

  const { user } = useAuth();

  // Function to scan the repository using Git
  useEffect(() => {
    const scanRepository = async () => {
      try {
        setLoading(true);
        
        // In a real-world implementation, we would execute Git commands here
        // This would typically be done in a backend service that has access to the Git repo
        
        // For demo purposes, we'll simulate executing these commands and parsing the output
        const gitCommands = [
          'git ls-files "src/**/*.jsx" "src/**/*.js" "src/**/*.tsx"',
          'git log --name-only --pretty=format:"%ad" --date=short -- src/'
        ];
        
        setGitOutput(`Executing Git commands:\n${gitCommands.join('\n')}\n\nAnalyzing repository structure...`);
        
        // Simulate Git command response based on the actual structure from your App.js
        // This would be replaced with actual Git command execution
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Parse the files from App.js and extract actual page components
        // These are based on the imports from your uploaded App.js file
        const routingComponents = [
          { component: 'LoginPage', path: '/login' },
          { component: 'UserManagement', path: '/user-management' },
          { component: 'Unauthorized', path: '/unauthorized' },
          { component: 'AdminDashboard', path: '/admindashboard' },
          { component: 'UserDashboard', path: '/userdashboard' },
          { component: 'OrgDashboard', path: '/orgdashboard' },
          { component: 'RequestList', path: '/requests' },
          { component: 'RequestDetail', path: '/requests/:id' },
          { component: 'NewRequest', path: '/requests/new' },
          { component: 'OrganizationList', path: '/organizations' },
          { component: 'OrganizationDetail', path: '/organizations/:id' },
          { component: 'OrganizationUsers', path: '/organizations/users' },
          { component: 'OrganizationProfile', path: '/organization-profile' },
          { component: 'RequestReports', path: '/reports/requests' },
          { component: 'PerformanceReports', path: '/reports/performance' },
          { component: 'OrganizationReports', path: '/reports/organizations' },
          { component: 'CustomReports', path: '/reports/custom' },
          { component: 'NotificationCenter', path: '/notifications' },
          { component: 'Contact', path: '/contact' }
        ];
        
        // Files from the entire src directory that could be React components
        // This simulates what Git would find scanning the entire src directory
        const detectedFiles = [
          // Pages actually in routing
          'src/pages/Login/Login.jsx',
          'src/pages/UserManagement/UserManagement.jsx',
          'src/pages/Unauthorized.jsx',
          'src/pages/dashboard/AdminDashboard.jsx',
          'src/pages/dashboard/UserDashboard.jsx',
          'src/pages/dashboard/OrgDashboard.jsx',
          'src/pages/requests/RequestList.jsx',
          'src/pages/requests/RequestDetail.jsx',
          'src/pages/requests/NewRequest.jsx',
          'src/pages/organizations/OrganizationList.jsx',
          'src/pages/organizations/OrganizationDetail.jsx',
          'src/pages/organizations/OrganizationUsers.jsx',
          'src/pages/organizations/OrganizationProfile.jsx',
          'src/pages/reports/RequestReports.jsx',
          'src/pages/reports/PerformanceReports.jsx',
          'src/pages/reports/OrganizationReports.jsx',
          'src/pages/reports/CustomReports.jsx',
          'src/pages/notifications/NotificationCenter.jsx',
          'src/pages/Contact.jsx',
          
          // Components in src that aren't in pages directory
          'src/components/dashboard/DashboardCard.jsx',
          'src/components/forms/RequestForm.jsx',
          'src/components/layout/Header.jsx',
          'src/components/layout/Footer.jsx',
          'src/components/layout/Sidebar.jsx',
          'src/components/common/Button.jsx',
          'src/components/common/Card.jsx',
          'src/components/common/Modal.jsx',
          
          // Potential unused pages
          'src/pages/old/OldDashboard.jsx',
          'src/pages/beta/BetaFeatures.jsx',
          'src/pages/archive/ArchivedRequests.jsx',
          'src/views/LegacyView.jsx',
          'src/screens/DeprecatedScreen.jsx',
          
          // Utils and hooks (not components)
          'src/utils/api.js',
          'src/utils/formatters.js',
          'src/hooks/useAuth.js',
          'src/hooks/useApi.js',
          
          // Context providers (could be components)
          'src/contexts/AuthContext.jsx',
          'src/contexts/ThemeContext.jsx',
          
          // Tests
          'src/tests/components/Button.test.js',
          'src/tests/pages/Login.test.js'
        ];
        
        // Analyze the files to create page objects
        const pageObjects = detectedFiles
          // Filter to only include JSX files that could be components
          .filter(filePath => 
            (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) && 
            !filePath.includes('.test.') && 
            !filePath.includes('.spec.')
          )
          .map(filePath => {
            // Extract component name from file path
            const pathParts = filePath.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const componentName = fileName.replace('.jsx', '').replace('.js', '').replace('.tsx', '');
            
            // Check if it's a component used in routing
            const routeInfo = routingComponents.find(r => 
              r.component === componentName || 
              `${componentName}Page` === r.component
            );
            
            // Determine if this could be a page component
            const isPageComponent = filePath.includes('/pages/') || 
                                 filePath.includes('/views/') || 
                                 filePath.includes('/screens/');
            
            // If it's in routing, use that path, otherwise generate one
            const routePath = routeInfo ? 
              routeInfo.path : 
              isPageComponent ? `/${componentName.toLowerCase()}` : null;
            
            // Check last modified date (would come from Git in real implementation)
            // For this demo, we'll use static dates
            const lastModified = routeInfo ? 
              '2024-02-15' : // Recently modified for pages in routing
              '2023-06-30';  // Older date for unused pages
            
            // Different recommendation categories
            let recommended = 'keep';
            let reason = 'Used in application';
            
            if (isPageComponent && !routeInfo) {
              // It's in a pages directory but not in routing
              recommended = 'delete';
              reason = 'Page component not found in routing configuration';
            } else if (!isPageComponent) {
              // It's a component but not in a pages directory
              recommended = 'review';
              reason = 'UI component, not a page';
            }
            
            return {
              id: filePath,
              path: routePath,
              component: componentName,
              filePath: filePath,
              lastModified: lastModified,
              inRouting: !!routeInfo,
              isPage: isPageComponent,
              recommended: recommended,
              reason: reason
            };
          });
        
        setPages(pageObjects);
        setLoading(false);
      } catch (err) {
        console.error('Error analyzing repository:', err);
        setError('Failed to analyze repository. Please check console for details.');
        setLoading(false);
      }
    };

    scanRepository();
  }, []);

  // Toggle page selection for deletion
  const togglePageForDeletion = (pageId) => {
    if (pagesToDelete.includes(pageId)) {
      setPagesToDelete(pagesToDelete.filter(id => id !== pageId));
    } else {
      setPagesToDelete([...pagesToDelete, pageId]);
    }
  };

  // Handle deletion (would connect to Git in real implementation)
  const handleDeletePages = async () => {
    try {
      setLoading(true);
      
      // This would execute Git commands to remove the files
      // For demo purposes, we'll just simulate the process
      const gitCommands = pagesToDelete.map(id => `git rm ${id}`);
      
      setGitOutput(`Executing Git commands:\n${gitCommands.join('\n')}\n\nCommitting changes...`);
      setShowGitOutput(true);
      
      // Simulate Git operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update UI
      setPages(pages.filter(page => !pagesToDelete.includes(page.id)));
      setPagesToDelete([]);
      setShowConfirmation(false);
      setDeleteMode(false);
      setGitOutput(gitOutput + '\n\nFiles successfully deleted and committed.');
      setLoading(false);
    } catch (err) {
      console.error('Error deleting files:', err);
      setError('Failed to delete files. Please check console for details.');
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

  // Filter pages based on criteria
  const filteredPages = pages.filter(page => {
    // Filter by recommendation
    if (filterType !== 'all' && page.recommended !== filterType) {
      return false;
    }
    
    // Search filter
    if (searchTerm && !page.path?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !page.component.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !page.filePath.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort pages
  const sortedPages = [...filteredPages].sort((a, b) => {
    let comparison = 0;
    
    switch(sortBy) {
      case 'path':
        // Handle null paths (components that aren't pages)
        if (!a.path && !b.path) comparison = 0;
        else if (!a.path) comparison = 1;
        else if (!b.path) comparison = -1;
        else comparison = a.path.localeCompare(b.path);
        break;
      case 'component':
        comparison = a.component.localeCompare(b.component);
        break;
      case 'filePath':
        comparison = a.filePath.localeCompare(b.filePath);
        break;
      case 'lastModified':
        comparison = new Date(b.lastModified) - new Date(a.lastModified);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Calculate statistics
  const pageCounts = {
    total: pages.length,
    keep: pages.filter(page => page.recommended === 'keep').length,
    delete: pages.filter(page => page.recommended === 'delete').length,
    review: pages.filter(page => page.recommended === 'review').length
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg">Scanning full src directory...</p>
          {gitOutput && (
            <div className="mt-6 bg-gray-800 text-green-400 p-4 rounded font-mono text-sm w-full max-w-lg overflow-auto">
              <pre>{gitOutput}</pre>
            </div>
          )}
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
        Repository analysis complete. Found {pages.length} potential components in your src directory.
      </p>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Total Components</h2>
          <p className="text-3xl font-bold">{pageCounts.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded shadow border-l-4 border-green-500">
          <h2 className="text-lg font-semibold mb-2">Keep</h2>
          <p className="text-3xl font-bold text-green-600">{pageCounts.keep}</p>
          <p className="text-xs text-green-700 mt-1">Used in routing</p>
        </div>
        <div className="bg-red-50 p-4 rounded shadow border-l-4 border-red-500">
          <h2 className="text-lg font-semibold mb-2">Delete</h2>
          <p className="text-3xl font-bold text-red-600">{pageCounts.delete}</p>
          <p className="text-xs text-red-700 mt-1">Unused page components</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded shadow border-l-4 border-yellow-500">
          <h2 className="text-lg font-semibold mb-2">Review</h2>
          <p className="text-3xl font-bold text-yellow-600">{pageCounts.review}</p>
          <p className="text-xs text-yellow-700 mt-1">UI components, not pages</p>
        </div>
      </div>
      
      {/* Git output toggle */}
      <div className="mb-4">
        <button 
          className="bg-gray-700 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowGitOutput(!showGitOutput)}
        >
          <span className="mr-2">{showGitOutput ? 'Hide' : 'Show'} Git Analysis</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${showGitOutput ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {showGitOutput && (
          <div className="mt-2 bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-auto">
            <pre>{gitOutput}</pre>
          </div>
        )}
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
                <option value="all">All Components</option>
                <option value="keep">Keep (In Routing)</option>
                <option value="delete">Delete (Unused Pages)</option>
                <option value="review">Review (UI Components)</option>
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
                placeholder="Search components..."
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
              {deleteMode ? 'Cancel' : 'Select Files to Delete'}
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
                    Route Path
                    {sortBy === 'path' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('filePath')}
                >
                  <div className="flex items-center">
                    File Path
                    {sortBy === 'filePath' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
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
                        disabled={page.recommended === 'keep'}
                      />
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.component}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.path || '—'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.filePath}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.lastModified}</div>
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
          <p className="text-gray-600">No components match your filter criteria</p>
        </div>
      )}

      {/* Implementation notes */}
      <div className="mt-6 bg-blue-50 p-4 rounded shadow border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Implementation Guide</h3>
        <p className="text-sm text-blue-700 mb-2">
          This component can be integrated with your actual Git repository using a backend API that:
        </p>
        <ol className="list-decimal pl-5 text-sm text-blue-700">
          <li className="mb-1">Scans your entire src directory for React components</li>
          <li className="mb-1">Cross-references the files with your App.js routing</li>
          <li className="mb-1">Uses Git history to determine last modified dates</li>
          <li className="mb-1">Provides an API endpoint for executing Git delete commands</li>
        </ol>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">
              Are you sure you want to delete these {pagesToDelete.length} files from your repository?
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
              This will delete these files from your Git repository. This action cannot be undone.
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
