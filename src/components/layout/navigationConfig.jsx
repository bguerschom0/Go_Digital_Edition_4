import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart, 
  Bookmark,
  Upload,
  Clock,
  CheckSquare,
  UserCog,
  Building,
  MessageSquare,
  FileSearch,
  PieChart,
  Settings,
  List,
  Plus,
  Bell
} from 'lucide-react';

export const roleBasedNavigation = {
  administrator: [
    {
      name: 'Dashboard',
      path: '/admindashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Requests',
      path: '/requests',
      icon: FileText,
      children: [
        {
          name: 'All Requests',
          path: '/requests',
          icon: List
        },
        {
          name: 'New Request',
          path: '/requests/new',
          icon: Plus
        },
        {
          name: 'Pending Requests',
          path: '/requests?status=pending',
          icon: Clock
        },
        {
          name: 'Completed Requests',
          path: '/requests?status=completed',
          icon: CheckSquare
        }
      ]
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart,
      children: [
        {
          name: 'Request Reports',
          path: '/reports/requests',
          icon: FileSearch
        },
        {
          name: 'Performance Reports',
          path: '/reports/performance',
          icon: PieChart
        },
        {
          name: 'Organization Reports',
          path: '/reports/organizations',
          icon: Building
        }
      ]
    },
    {
      name: 'Organizations',
      path: '/organizations',
      icon: Building,
      children: [
        {
          name: 'All Organizations',
          path: '/organizations',
          icon: List
        },
        {
          name: 'Add Organization',
          path: '/organizations/new',
          icon: Plus
        },
        {
          name: 'Organization Users',
          path: '/organizations/users',
          icon: Users
        }
      ]
    },
    {
      name: 'User Management',
      path: '/user-management',
      icon: Users
    },
        {
      name: 'Dashboards',
      path: '',
      icon: LayoutDashboard,
      children: [
        {
          name: 'Organization Dashboard',
          path: '/orgdashboard',
          icon: LayoutDashboard
        },
        {
          name: 'User Dashboard',
          path: '/userdashboard',
          icon: LayoutDashboard
        }
      ]
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings
    }
  ],
  
  user: [
    {
      name: 'Dashboard',
      path: '/userdashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Requests',
      path: '/requests',
      icon: FileText,
      children: [
        {
          name: 'All Requests',
          path: '/requests',
          icon: List
        },
        {
          name: 'New Request',
          path: '/requests/new',
          icon: Plus
        },
        {
          name: 'Pending Requests',
          path: '/requests?status=pending',
          icon: Clock
        },
        {
          name: 'Completed Requests',
          path: '/requests?status=completed',
          icon: CheckSquare
        },
        {
          name: 'Upload Response',
          path: '/requests?filter=assigned',
          icon: Upload
        }
      ]
    },
    {
      name: 'Organizations',
      path: '/organizations',
      icon: Building,
      children: [
        {
          name: 'All Organizations',
          path: '/organizations',
          icon: List
        },
        {
          name: 'View Organization Users',
          path: '/organizations/users/view',
          icon: Users
        }
      ]
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell
    }
  ],
  
  organization: [
    {
      name: 'Dashboard',
      path: '/orgdashboard',
      icon: LayoutDashboard
    },
    {
      name: 'My Requests',
      path: '/requests',
      icon: FileText,
      children: [
        {
          name: 'All Requests',
          path: '/requests',
          icon: List
        },
        {
          name: 'New Request',
          path: '/requests/new',
          icon: Plus
        },
        {
          name: 'Pending Requests',
          path: '/requests?status=pending',
          icon: Clock
        },
        {
          name: 'Completed Requests',
          path: '/requests?status=completed',
          icon: CheckSquare
        }
      ]
    },
    {
      name: 'Organization Profile',
      path: '/organization-profile',
      icon: Building
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell
    },
    {
      name: 'Contact Support',
      path: '/contact',
      icon: MessageSquare
    }
  ]
};





  
