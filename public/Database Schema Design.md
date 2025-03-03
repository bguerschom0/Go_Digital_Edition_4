# Database Schema for Document Request System

This document outlines the database schema design for the Document Request Management System, using Supabase.

## Tables

### users

Stores user information and authentication details.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'processor', 'organization', 'supervisor')),
    organization TEXT,
    email TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    temp_password TEXT,
    temp_password_expires TIMESTAMP WITH TIME ZONE,
    password_change_required BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization);
```

### organizations

Stores information about organizations that submit requests.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### requests

Stores information about document requests.

```sql
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT NOT NULL,
    date_received DATE NOT NULL,
    sender UUID NOT NULL REFERENCES organizations(id),
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    is_duplicate BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    deletion_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster lookups and searches
CREATE INDEX idx_requests_reference ON requests(reference_number);
CREATE INDEX idx_requests_sender ON requests(sender);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_deletion_date ON requests(deletion_date);
```

### request_files

Stores files associated with requests.

```sql
CREATE TABLE request_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    is_secured BOOLEAN DEFAULT FALSE,
    is_original_request BOOLEAN DEFAULT FALSE,
    is_response BOOLEAN DEFAULT FALSE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_request_files_request_id ON request_files(request_id);
```

### comments

Stores comments associated with requests.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_comments_request_id ON comments(request_id);
```

### notifications

Stores in-app notifications for users.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

### request_activity_log

Tracks all activity related to requests for audit purposes.

```sql
CREATE TABLE request_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_request_activity_log_request_id ON request_activity_log(request_id);
```

## Automated Functions

### Set Deletion Date Trigger

Automatically sets the deletion date when a request is marked as completed.

```sql
CREATE OR REPLACE FUNCTION set_deletion_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.deletion_date := (NEW.completed_at + INTERVAL '3 months');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_deletion_date
BEFORE UPDATE ON requests
FOR EACH ROW
EXECUTE PROCEDURE set_deletion_date();
```

### Request Activity Logging Trigger

Automatically logs activities when requests are created or updated.

```sql
CREATE OR REPLACE FUNCTION log_request_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO request_activity_log (request_id, user_id, action, details)
        VALUES (NEW.id, NEW.created_by, 'created', json_build_object('reference', NEW.reference_number));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO request_activity_log (request_id, user_id, action, details)
        VALUES (NEW.id, NEW.updated_by, 'updated', json_build_object(
            'reference', NEW.reference_number,
            'changes', json_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'old_assigned_to', OLD.assigned_to,
                'new_assigned_to', NEW.assigned_to
            )
        ));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_request_activity_trigger
AFTER INSERT OR UPDATE ON requests
FOR EACH ROW
EXECUTE PROCEDURE log_request_activity();
```

### Notification Creation Trigger

Automatically creates notifications when specific events occur.

```sql
CREATE OR REPLACE FUNCTION create_request_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- When a request is assigned
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
        INSERT INTO notifications (user_id, title, message, related_request_id)
        VALUES (NEW.assigned_to, 'New Request Assigned', 
                'You have been assigned to request #' || NEW.reference_number, 
                NEW.id);
    END IF;
    
    -- When a request is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Notify organization users associated with the sender
        INSERT INTO notifications (user_id, title, message, related_request_id)
        SELECT u.id, 'Request Completed', 
               'Request #' || NEW.reference_number || ' has been completed',
               NEW.id
        FROM users u
        WHERE u.role = 'organization' AND u.organization = (
            SELECT name FROM organizations WHERE id = NEW.sender
        );
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_request_notification_trigger
AFTER UPDATE ON requests
FOR EACH ROW
EXECUTE PROCEDURE create_request_notification();
```

## Row Level Security Policies

These policies determine who can access which records in each table.

### Users Table Policies

```sql
-- Only admins can see all users
CREATE POLICY admin_all_users ON users
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Users can see their own data
CREATE POLICY users_see_self ON users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());
```

### Requests Table Policies

```sql
-- Admins and processors can see all requests
CREATE POLICY admin_processor_all_requests ON requests
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role IN ('admin', 'processor', 'supervisor')
    ));

-- Organization users can only see their own organization's requests
CREATE POLICY org_users_see_own_org ON requests
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT u.id FROM users u 
            JOIN organizations o ON u.organization = o.name
            WHERE o.id = requests.sender AND u.role = 'organization'
        )
    );

-- Organization users can comment on their requests
CREATE POLICY org_users_can_comment ON comments
    FOR INSERT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT u.id FROM users u 
            JOIN organizations o ON u.organization = o.name
            WHERE o.id = (SELECT sender FROM requests WHERE id = comments.request_id)
            AND u.role = 'organization'
        )
    );
```

## Storage Bucket Policies

```sql
-- Create a secure bucket for request files
CREATE POLICY admin_processor_all_files ON storage.objects
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role IN ('admin', 'processor')
    ));

-- Organization users can only access their organization's files
CREATE POLICY org_users_own_files ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT u.id FROM users u 
            JOIN organizations o ON u.organization = o.name
            JOIN requests r ON o.id = r.sender
            JOIN request_files rf ON r.id = rf.request_id
            WHERE storage.objects.name = rf.file_path
            AND u.role = 'organization'
        )
    );
```

## Indexes and Performance Considerations

- Added appropriate indexes on frequently queried columns
- Used UUID as primary keys for scalability
- Implemented timestamp fields for tracking and auditing
- Used foreign key constraints to maintain data integrity
- Added check constraints to ensure valid values in critical fields
