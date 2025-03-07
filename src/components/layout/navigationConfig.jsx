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
      name: 'Organizations',
      path: '/organizations',
      icon: Building
    },
    
    {
      name: 'User Management',
      path: '/user-management',
      icon: UserCog
    },
    
    {
      name: 'Requests',
      path: '/requests',
      icon: FileText
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
      icon: FileText
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
          name: 'Organization Reports',
          path: '/reports/organizations',
          icon: Building
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
      icon: FileText
    },
    {
      name: 'Organization Profile',
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





  
