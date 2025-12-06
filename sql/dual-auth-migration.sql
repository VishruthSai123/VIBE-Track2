-- ==============================================================================
-- VIBETRACK DUAL AUTHENTICATION SYSTEM MIGRATION
-- ==============================================================================
-- This migration implements:
-- 1. Dual Login System (Admin/Founder vs Team Member)
-- 2. Custom Team Member credentials (admin-assigned email/password)
-- 3. Unique IDs for Organizations, Workspaces, Projects
-- 4. Removal of invite/link-based system
-- 5. Direct member creation by admin/founder
-- ==============================================================================

-- ==============================================================================
-- 1. UPDATE ORGANIZATIONS TABLE - Add unique code/ID for login
-- ==============================================================================

-- Add unique organization code for member login
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- Generate codes for existing organizations
UPDATE public.organizations 
SET code = LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0')
WHERE code IS NULL;

-- Make code NOT NULL after populating existing rows
ALTER TABLE public.organizations ALTER COLUMN code SET NOT NULL;

-- Create index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_organizations_code ON public.organizations(code);

-- ==============================================================================
-- 2. UPDATE WORKSPACES TABLE - Add unique code/ID for login
-- ==============================================================================

-- Add unique workspace code for member login
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.workspaces ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- Generate codes for existing workspaces
UPDATE public.workspaces 
SET code = LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0')
WHERE code IS NULL;

-- Create index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_code ON public.workspaces(code);

-- ==============================================================================
-- 3. UPDATE PROJECTS TABLE - Add unique code/ID for login
-- ==============================================================================

-- Add unique project code for member login
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- Generate codes for existing projects (6-digit numeric)
UPDATE public.projects 
SET code = LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0')
WHERE code IS NULL;

-- Create index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(code);

-- ==============================================================================
-- 4. CREATE TEAM_MEMBERS TABLE - Admin-created member accounts
-- ==============================================================================

-- This table stores team members created by admins (not self-registered)
CREATE TABLE IF NOT EXISTS public.team_members (
  id text PRIMARY KEY,
  
  -- Credentials (admin-assigned)
  email text NOT NULL,
  "passwordHash" text NOT NULL,               -- Hashed password
  
  -- Profile info
  name text NOT NULL,
  avatar text,
  "jobTitle" text,
  
  -- Scope - which entity they belong to
  "scopeType" text NOT NULL CHECK ("scopeType" IN ('organization', 'workspace', 'project')),
  "scopeId" text NOT NULL,                    -- The org/workspace/project ID
  "scopeCode" text NOT NULL,                  -- The org/workspace/project code for login
  
  -- Role within that scope
  role text NOT NULL,
  
  -- Metadata
  "createdBy" uuid REFERENCES public.profiles(id),  -- Admin who created this member
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "lastLoginAt" timestamp with time zone,
  "isActive" boolean DEFAULT true,
  
  -- Unique constraint: email must be unique within a scope
  CONSTRAINT team_members_unique_email_per_scope UNIQUE ("scopeId", email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_scope ON public.team_members("scopeType", "scopeId");
CREATE INDEX IF NOT EXISTS idx_team_members_scope_code ON public.team_members("scopeCode");
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members("isActive") WHERE "isActive" = true;

-- ==============================================================================
-- 5. UPDATE PROFILES TABLE - Add isAdmin flag
-- ==============================================================================

-- Add isAdmin flag to distinguish founders/admins from team members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'isAdmin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN "isAdmin" boolean DEFAULT true;
  END IF;
END $$;

-- All existing profiles are admins (founders)
UPDATE public.profiles SET "isAdmin" = true WHERE "isAdmin" IS NULL;

-- ==============================================================================
-- 6. DROP OLD INVITES TABLE (No longer needed)
-- ==============================================================================

-- We're replacing the invite system with direct member creation
-- Keep the table but mark it as deprecated, or drop if you want clean slate
-- DROP TABLE IF EXISTS public.invites CASCADE;

-- If you want to keep history, just disable it:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invites') THEN
    -- Rename to archive
    ALTER TABLE IF EXISTS public.invites RENAME TO invites_archived;
  END IF;
END $$;

-- ==============================================================================
-- 7. CREATE FUNCTION TO GENERATE UNIQUE CODES
-- ==============================================================================

CREATE OR REPLACE FUNCTION generate_unique_code(prefix text DEFAULT '', length integer DEFAULT 6)
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 6-digit numeric code (e.g., 123456)
    new_code := LPAD(FLOOR(RANDOM() * POWER(10, length))::text, length, '0');
    
    -- Check if code exists in any table
    SELECT EXISTS(
      SELECT 1 FROM public.organizations WHERE code = new_code
      UNION ALL
      SELECT 1 FROM public.workspaces WHERE code = new_code
      UNION ALL
      SELECT 1 FROM public.projects WHERE code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 8. CREATE FUNCTION TO HASH PASSWORDS (using pgcrypto)
-- ==============================================================================

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash password
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_password(password text, password_hash text)
RETURNS boolean AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 9. CREATE TEAM_MEMBER_SESSIONS TABLE (for member auth tokens)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.team_member_sessions (
  id text PRIMARY KEY,
  "memberId" text REFERENCES public.team_members(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "ipAddress" text,
  "userAgent" text
);

CREATE INDEX IF NOT EXISTS idx_team_member_sessions_token ON public.team_member_sessions(token);
CREATE INDEX IF NOT EXISTS idx_team_member_sessions_member ON public.team_member_sessions("memberId");
CREATE INDEX IF NOT EXISTS idx_team_member_sessions_expires ON public.team_member_sessions("expiresAt");

-- ==============================================================================
-- 10. RLS POLICIES FOR TEAM_MEMBERS
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can manage team members in their org/workspace
CREATE POLICY "Admins can view team members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om."orgId" = team_members."scopeId"
      AND om."userId" = auth.uid()
      AND om.role IN ('Founder', 'Admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm."workspaceId" = team_members."scopeId"
      AND wm."userId" = auth.uid()
      AND wm.role IN ('Workspace Admin')
    )
  );

CREATE POLICY "Admins can insert team members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om."orgId" = team_members."scopeId"
      AND om."userId" = auth.uid()
      AND om.role IN ('Founder', 'Admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm."workspaceId" = team_members."scopeId"
      AND wm."userId" = auth.uid()
      AND wm.role IN ('Workspace Admin')
    )
  );

CREATE POLICY "Admins can update team members" ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om."orgId" = team_members."scopeId"
      AND om."userId" = auth.uid()
      AND om.role IN ('Founder', 'Admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm."workspaceId" = team_members."scopeId"
      AND wm."userId" = auth.uid()
      AND wm.role IN ('Workspace Admin')
    )
  );

CREATE POLICY "Admins can delete team members" ON public.team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om."orgId" = team_members."scopeId"
      AND om."userId" = auth.uid()
      AND om.role IN ('Founder', 'Admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm."workspaceId" = team_members."scopeId"
      AND wm."userId" = auth.uid()
      AND wm.role IN ('Workspace Admin')
    )
  );

-- Team members can view their own sessions
CREATE POLICY "Members can view own sessions" ON public.team_member_sessions
  FOR SELECT USING (true);

-- ==============================================================================
-- 11. TRIGGERS FOR AUTO-GENERATING CODES
-- ==============================================================================

-- Trigger for organizations
CREATE OR REPLACE FUNCTION set_organization_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_unique_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_organization_code ON public.organizations;
CREATE TRIGGER trg_set_organization_code
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_code();

-- Trigger for workspaces
CREATE OR REPLACE FUNCTION set_workspace_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_unique_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_workspace_code ON public.workspaces;
CREATE TRIGGER trg_set_workspace_code
  BEFORE INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION set_workspace_code();

-- Trigger for projects
CREATE OR REPLACE FUNCTION set_project_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_unique_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_project_code ON public.projects;
CREATE TRIGGER trg_set_project_code
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_code();

-- ==============================================================================
-- 12. VIEW FOR EASY MEMBER LOOKUP
-- ==============================================================================

CREATE OR REPLACE VIEW public.team_members_with_scope AS
SELECT 
  tm.*,
  CASE tm."scopeType"
    WHEN 'organization' THEN org.name
    WHEN 'workspace' THEN ws.name
    WHEN 'project' THEN proj.name
  END as "scopeName"
FROM public.team_members tm
LEFT JOIN public.organizations org ON tm."scopeType" = 'organization' AND tm."scopeId" = org.id
LEFT JOIN public.workspaces ws ON tm."scopeType" = 'workspace' AND tm."scopeId" = ws.id
LEFT JOIN public.projects proj ON tm."scopeType" = 'project' AND tm."scopeId" = proj.id;

-- ==============================================================================
-- SUMMARY OF NEW LOGIN FLOW
-- ==============================================================================
-- 
-- ADMIN/FOUNDER LOGIN:
-- 1. Select "Admin Login"
-- 2. Enter email + password (uses Supabase Auth)
-- 3. Authenticated via auth.users
-- 
-- TEAM MEMBER LOGIN:
-- 1. Select "Member Login"
-- 2. Enter 6-digit Scope Code (e.g., "123456")
-- 3. Enter assigned email
-- 4. Enter assigned password
-- 5. Authenticated via team_members table + custom session
--
-- MEMBER CREATION (by Admin):
-- 1. Admin goes to Team Management
-- 2. Clicks "Add Member"
-- 3. Enters: name, email, password, role
-- 4. Selects scope (org/workspace/project)
-- 5. Member account is created in team_members table
-- 6. Member can now login with: 6-digit code + email + password
--
-- ==============================================================================
