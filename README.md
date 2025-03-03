# Go Digital Edition 4

# Document Request Management System

A comprehensive solution for managing document requests, secure file sharing, and request tracking.

## Features

- **Request Management**: Record, track, and process document requests
- **Secure Document Handling**: Upload and share documents with security controls
- **User Role Management**: Different access levels for administrators, processors, and organizations
- **In-App Notifications**: Keep users informed about request status changes
- **Reporting and Analytics**: Generate insights from request data
- **PDF Security**: Prevent document editing while allowing printing
- **Multi-File Upload**: Upload multiple response documents at once
- **Comment System**: Two-way communication between requesters and processors

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **State Management**: React Context API with custom hooks
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **File Storage**: Supabase Storage
- **PDF Processing**: pdf-lib for security features
- **Deployment**: Vercel (testing), Local server (production)

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/document-request-system.git
cd document-request-system
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your Supabase credentials
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server
```bash
npm start
# or
yarn start
```

## Project Structure

The project follows a modular structure:

- `/components`: Reusable UI components
- `/pages`: Main application pages
- `/hooks`: Custom React hooks
- `/services`: API and service functions
- `/utils`: Utility functions
- `/config`: Configuration files

## Development Workflow

1. **Setup Database**: Configure Supabase tables for users, requests, files, and notifications
2. **Implement Core Features**: Request management, user roles, file uploads
3. **Add Security Features**: PDF protection, access controls
4. **Develop UI**: Dashboard, request cards, forms, and reports
5. **Testing**: Comprehensive testing of all features
6. **Deployment**: Initially on Vercel, then migration to local server

## Database Schema

### Users Table
- id
- username
- full_name
- role
- organization
- is_active
- created_at
- updated_at

### Requests Table
- id
- reference_number
- date_received
- sender
- subject
- status
- created_by
- assigned_to
- created_at
- updated_at
- deletion_date

### Files Table
- id
- request_id
- file_name
- file_path
- file_size
- uploaded_by
- is_secured
- created_at
- updated_at

### Comments Table
- id
- request_id
- user_id
- content
- created_at
- updated_at

### Notifications Table
- id
- user_id
- title
- message
- is_read
- related_request_id
- created_at

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- **Advanced Analytics**: More detailed reporting capabilities
- **Automated Workflows**: Rule-based processing of common request types
- **API Integration**: Webhook support for integration with other systems
- **Mobile Application**: Companion mobile app for on-the-go access
- **Batch Processing**: Tools for handling multiple requests simultaneously
