

src/
├── components/
│   ├── requests/
│   │   ├── RequestCard.jsx.         - Card component for displaying requests
│   │   ├── RequestForm.jsx.        - Form for creating new requests
│   │   ├── FileUploader.jsx.        - Multi-file uploader with PDF security
│   │   ├── CommentSection.jsx.      - Two-way communication system
│   │   └── RequestDetails.jsx      - Detailed view component for a request
│   ├── notifications/
│   │   ├── NotificationBell.jsx.    - In-app notification bell for header
│   │   ├── NotificationItem.jsx.    - Individual notification component
│   │   └── NotificationList.jsx.    - List of notifications
│   └── organizations/
│       ├── OrganizationForm.jsx.    - Form for creating/editing organizations
│       └── UserOrgAssignment.jsx.   - Component to assign users to organizations
├── pages/
│   ├── requests/
│   │   ├── RequestList.jsx.         - List of all requests with filters
│   │   ├── RequestDetail.jsx       - Detailed view of single request
│   │   └── NewRequest.jsx.          - Page for creating new request
│   ├── organizations/
│   │   ├── OrganizationList.jsx.    - List of all organizations
│   │   ├── OrganizationDetail.jsx.  - Detailed view of single organization
│   │   └── OrganizationUsers.jsx.   - Page for assigning users to organizations
│   └── notifications/
│       └── NotificationCenter.jsx.  - Page for viewing all notifications
├── services/
│   ├── requestService.js.           - API calls for requests
│   ├── fileService.js.              - File handling functions
│   ├── organizationService.js.      - API calls for organizations
│   ├── notificationService.js.      - Notification handling
│   └── pdfSecurityService.js.       - PDF security functions
└── hooks/
    ├── useRequest.js.               - Hook for request operations
    ├── useOrganization.js.          - Hook for organization operations
    └── useNotifications.js.         - Hook for notification management






    src/
├── pages/
│   └── reports/
│       ├── RequestReports.jsx.      - Reports on request status, volume, etc.
│       ├── PerformanceReports.jsx.  - Reports on response times, user activity
│       ├── OrganizationReports.jsx. - Reports filtered by organization
│       └── CustomReports.jsx.       - User-defined custom reports
├── components/
│   └── reports/
│       ├── ReportFilters.jsx.       - Reusable filters for reports
│       ├── ReportTable.jsx.         - Tabular report display component
│       ├── ReportChart.jsx.         - Visual charts for reports
│       ├── ReportExport.jsx        - Export functionality (PDF, Excel)
│       └── DateRangePicker.jsx     - Custom date range selector
├── services/
│   └── reportService.js.            - API calls for report data
└── hooks/
    └── useReports.js.               - Custom hook for report functionality
