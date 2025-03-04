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
  MessageSquare
} from 'lucide-react';

export const roleBasedNavigation = {
  admin: [
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
    {
      name: 'User Management',
      path: '/user-management',
      icon: Users
    },
    {
      name: 'Role Management',
      path: '/role-management',
      icon: UserCog
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
