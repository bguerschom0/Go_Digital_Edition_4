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
  ListChecks,
  UserPlus
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
          icon: Bookmark
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
          name: 'Request Analytics',
          path: '/request-analytics',
          icon: BarChart
        },
        {
          name: 'Request Reports',
          path: '/reports/requests',
          icon: FileText
        }
      ]
    },
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
      name: 'User Management',
      path: '/user-management',
      icon: Users
    },
    {
      name: 'Organizations',
      path: '/organizations',
      icon: Building,
      children: [
        {
          name: 'Organization List',
          path: '/organizations',
          icon: ListChecks
        },
        {
          name: 'Organization Users',
          path: '/organization-users',
          icon: UserPlus
        }
      ]
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
          icon: Bookmark
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
          icon: Bookmark
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
      name: 'Organization',
      path: '/organization-profile',
      icon: Building
    },
    {
      name: 'Contact Support',
      path: '/contact',
      icon: MessageSquare
    }
  ]
};
