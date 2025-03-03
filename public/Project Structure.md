src/
├── assets/
│   ├── logo.png
│   └── icons/
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Sidebar.jsx
│   │   └── navigationConfig.js
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Dialog.jsx
│   │   └── ...
│   ├── requests/
│   │   ├── RequestCard.jsx
│   │   ├── RequestForm.jsx
│   │   ├── RequestDetails.jsx
│   │   ├── CommentSection.jsx
│   │   ├── FileUploader.jsx
│   │   ├── DocumentViewer.jsx
│   │   └── StatusBadge.jsx
│   ├── users/
│   │   ├── UserForm.jsx
│   │   ├── RoleManager.jsx
│   │   └── OrganizationSelector.jsx
│   ├── notifications/
│   │   ├── NotificationPanel.jsx
│   │   ├── NotificationItem.jsx
│   │   └── NotificationBell.jsx
│   ├── reports/
│   │   ├── ReportFilters.jsx
│   │   ├── ReportTable.jsx
│   │   ├── ReportExport.jsx
│   │   ├── ChartDisplay.jsx
│   │   └── MetricsCard.jsx
│   └── common/
│       ├── StatCard.jsx
│       ├── SearchBar.jsx
│       └── Pagination.jsx
├── config/
│   ├── supabase.js
│   └── constants.js
├── hooks/
│   ├── useAuth.js
│   ├── useRoleCheck.js
│   ├── useNotifications.js
│   ├── useRequests.js
│   ├── useReports.js
│   └── useFileProcessing.js
├── pages/
│   ├── Login/
│   │   └── Login.jsx
│   ├── dashboard/
│   │   ├── AdminDashboard.jsx
│   │   ├── UserDashboard.jsx
│   │   └── OrgDashboard.jsx
│   ├── requests/
│   │   ├── RequestList.jsx
│   │   ├── RequestDetail.jsx
│   │   ├── NewRequest.jsx
│   │   └── RequestAnalytics.jsx
│   ├── UserManagement/
│   │   ├── UserManagement.jsx
│   │   └── RoleManagement.jsx
│   ├── reports/
│   │   ├── RequestReports.jsx
│   │   ├── PerformanceReports.jsx
│   │   └── CustomReports.jsx
│   └── Unauthorized.jsx
├── services/
│   ├── requestService.js
│   ├── userService.js
│   ├── notificationService.js
│   ├── fileService.js
│   ├── pdfSecurityService.js
│   └── reportService.js
├── utils/
│   ├── roleRoutes.js
│   ├── dateUtils.js
│   ├── validationUtils.js
│   ├── fileUtils.js
│   ├── reportUtils.js
│   └── formatUtils.js
└── App.jsx
