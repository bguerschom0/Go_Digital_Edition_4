 #1

CREATE TABLE v4_organizations (
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




CREATE TABLE v4_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT NOT NULL,
  date_received DATE NOT NULL,
  sender UUID NOT NULL REFERENCES v4_organizations(id),
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

CREATE TABLE v4_request_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES v4_requests(id) ON DELETE CASCADE,
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

CREATE TABLE v4_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES v4_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE v4_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_request_id UUID REFERENCES v4_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE v4_user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES v4_organizations(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);






#2

-- Migration script to add phone2 column and migrate data from contact_person

-- Add the new phone2 column if it doesn't exist
DO $$
BEGIN
    -- Check if phone2 column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'v4_organizations' 
        AND column_name = 'phone2'
    ) THEN
        -- Add phone2 column
        ALTER TABLE v4_organizations ADD COLUMN phone2 TEXT;
        
        -- Copy data from contact_person to phone2
        UPDATE v4_organizations 
        SET phone2 = contact_person 
        WHERE contact_person IS NOT NULL AND contact_person != '';
    END IF;
END
$$;

-- Optional: You can keep contact_person for now as a backup
-- If you want to remove it later, use:
-- ALTER TABLE v4_organizations DROP COLUMN contact_person;








#3


-- Add columns for tracking login attempts to users table
ALTER TABLE users
ADD COLUMN failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index on the username column for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Update any existing users to have 0 failed attempts
UPDATE users
SET failed_login_attempts = 0
WHERE failed_login_attempts IS NULL;

-- Ensure all inactive accounts have failed_login_attempts set to 5
-- This is to maintain consistency with the account lockout rule
UPDATE users
SET failed_login_attempts = 5
WHERE is_active = false AND failed_login_attempts < 5;

-- Optional: You can add a database trigger to automatically lock accounts
-- when failed_login_attempts reaches 5
CREATE OR REPLACE FUNCTION lock_account_on_max_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.failed_login_attempts >= 5 AND NEW.is_active = true THEN
        NEW.is_active := false;
        NEW.locked_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_account_lock
BEFORE UPDATE ON users
FOR EACH ROW
WHEN (OLD.failed_login_attempts < 5 AND NEW.failed_login_attempts >= 5)
EXECUTE FUNCTION lock_account_on_max_attempts();











#4


-- Function to calculate average response time by organization
CREATE OR REPLACE FUNCTION public.v4_get_avg_response_times_by_org(
  start_date date,
  end_date date
)
RETURNS TABLE (
  org_id uuid,
  org_name text,
  avg_days numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.sender as org_id,
    o.name as org_name,
    COALESCE(AVG(EXTRACT(EPOCH FROM (r.completed_at - r.date_received)) / 86400), 0) as avg_days
  FROM 
    v4_requests r
    JOIN v4_organizations o ON r.sender = o.id
  WHERE 
    r.date_received >= start_date
    AND r.date_received <= end_date
    AND r.completed_at IS NOT NULL
  GROUP BY 
    r.sender, o.name
  ORDER BY 
    avg_days DESC;
END;
$$;

-- Function to calculate average response time overall or for a specific organization
CREATE OR REPLACE FUNCTION public.v4_get_avg_response_time(
  start_date date,
  end_date date,
  org_id uuid DEFAULT NULL
)
RETURNS TABLE (
  avg_days numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  IF org_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      COALESCE(AVG(EXTRACT(EPOCH FROM (r.completed_at - r.date_received)) / 86400), 0) as avg_days
    FROM 
      v4_requests r
    WHERE 
      r.date_received >= start_date
      AND r.date_received <= end_date
      AND r.completed_at IS NOT NULL
      AND r.sender = org_id;
  ELSE
    RETURN QUERY
    SELECT 
      COALESCE(AVG(EXTRACT(EPOCH FROM (r.completed_at - r.date_received)) / 86400), 0) as avg_days
    FROM 
      v4_requests r
    WHERE 
      r.date_received >= start_date
      AND r.date_received <= end_date
      AND r.completed_at IS NOT NULL;
  END IF;
END;
$$;

-- Function to get monthly requests by organization
CREATE OR REPLACE FUNCTION public.v4_get_monthly_requests_by_org(
  start_date date,
  end_date date,
  org_id uuid DEFAULT NULL
)
RETURNS TABLE (
  month date,
  total_count bigint,
  completed_count bigint,
  pending_count bigint,
  in_progress_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  IF org_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      DATE_TRUNC('month', r.date_received)::date as month,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE r.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE r.status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE r.status = 'in_progress') as in_progress_count
    FROM 
      v4_requests r
    WHERE 
      r.date_received >= start_date
      AND r.date_received <= end_date
      AND r.sender = org_id
    GROUP BY 
      DATE_TRUNC('month', r.date_received)
    ORDER BY 
      month;
  ELSE
    RETURN QUERY
    SELECT 
      DATE_TRUNC('month', r.date_received)::date as month,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE r.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE r.status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE r.status = 'in_progress') as in_progress_count
    FROM 
      v4_requests r
    WHERE 
      r.date_received >= start_date
      AND r.date_received <= end_date
    GROUP BY 
      DATE_TRUNC('month', r.date_received)
    ORDER BY 
      month;
  END IF;
END;
$$;









#5

-- Step 1: Add inactivity tracking columns to the users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS inactivity_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS inactivity_locked_at TIMESTAMPTZ;

-- Step 2: Create an index for more efficient queries on last_login
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Step 3: Create a database function that checks for inactive users and marks them
CREATE OR REPLACE FUNCTION mark_inactive_users() RETURNS void AS $$
BEGIN
  -- Update users who haven't logged in for more than 20 days and are still active
  UPDATE users
  SET 
    is_active = FALSE,
    inactivity_locked = TRUE,
    inactivity_locked_at = CURRENT_TIMESTAMP
  WHERE 
    is_active = TRUE 
    AND last_login IS NOT NULL
    AND last_login < (CURRENT_TIMESTAMP - INTERVAL '20 days');
    
  -- Log the action
  RAISE NOTICE 'Inactive users check completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Set up a scheduled job to run the function daily using pg_cron
-- Note: This requires the pg_cron extension to be enabled on your database

-- Enable pg_cron extension (requires superuser privileges)
-- This only needs to be run once on the database
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run daily at midnight
SELECT cron.schedule('0 0 * * *', 'SELECT mark_inactive_users()');

-- Optional: To check what jobs are scheduled
-- SELECT * FROM cron.job;

-- Step 5: Set up a trigger that also checks a user's inactivity status on login
-- This provides an additional check when a user attempts to log in
CREATE OR REPLACE FUNCTION check_user_inactivity() RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user hasn't logged in for 20+ days
  IF (OLD.last_login IS NOT NULL AND 
      NEW.is_active = TRUE AND 
      OLD.last_login < (CURRENT_TIMESTAMP - INTERVAL '20 days')) THEN
    
    -- Set the user as inactive due to inactivity
    NEW.is_active := FALSE;
    NEW.inactivity_locked := TRUE;
    NEW.inactivity_locked_at := CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'User % has been marked inactive due to 20+ days of inactivity', NEW.username;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS before_user_update ON users;
CREATE TRIGGER before_user_update
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_user_inactivity();

-- Step 6: Optional - Function to manually check and list inactive users
CREATE OR REPLACE FUNCTION list_inactive_users() RETURNS TABLE (
  username TEXT,
  full_name TEXT,
  last_login TIMESTAMPTZ,
  days_since_login INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.username,
    u.full_name,
    u.last_login,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - u.last_login))::INTEGER AS days_since_login
  FROM 
    users u
  WHERE 
    u.is_active = TRUE
    AND u.last_login < (CURRENT_TIMESTAMP - INTERVAL '20 days')
  ORDER BY 
    u.last_login;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create a function to reactivate users through the database
CREATE OR REPLACE FUNCTION reactivate_user(user_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  UPDATE users
  SET 
    is_active = TRUE,
    inactivity_locked = FALSE,
    inactivity_locked_at = NULL
  WHERE id = user_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT reactivate_user('user-uuid-here');
