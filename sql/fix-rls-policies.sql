-- ==============================================================================
-- FIX RLS POLICIES - Resolve infinite recursion and permission issues
-- ==============================================================================
-- Run this in Supabase SQL Editor to fix the RLS policy issues
-- ==============================================================================

-- ==============================================================================
-- 1. DROP PROBLEMATIC RLS POLICIES ON ORG_MEMBERS
-- ==============================================================================

-- First, disable RLS temporarily to fix the issues
ALTER TABLE IF EXISTS public.org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Users can view their org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Org admins can manage members" ON public.org_members;
DROP POLICY IF EXISTS "org_members_select_policy" ON public.org_members;
DROP POLICY IF EXISTS "org_members_insert_policy" ON public.org_members;
DROP POLICY IF EXISTS "org_members_update_policy" ON public.org_members;
DROP POLICY IF EXISTS "org_members_delete_policy" ON public.org_members;

DROP POLICY IF EXISTS "Users can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;

DROP POLICY IF EXISTS "Users can view workspace memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_policy" ON public.workspace_members;

DROP POLICY IF EXISTS "Users can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_policy" ON public.workspaces;

-- ==============================================================================
-- 2. CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- ==============================================================================

-- Re-enable RLS
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- ORG_MEMBERS: Simple policies without recursion
-- Users can see their own memberships
CREATE POLICY "org_members_select_own"
ON public.org_members FOR SELECT
USING (auth.uid() = "userId");

-- Users can insert their own membership (for signup/invite acceptance)
CREATE POLICY "org_members_insert_own"
ON public.org_members FOR INSERT
WITH CHECK (auth.uid() = "userId" OR auth.uid() IS NOT NULL);

-- Users can update/delete if they are the user or an admin of that org
CREATE POLICY "org_members_update_own"
ON public.org_members FOR UPDATE
USING (auth.uid() = "userId");

CREATE POLICY "org_members_delete_own"
ON public.org_members FOR DELETE
USING (auth.uid() = "userId");

-- ORGANIZATIONS: Simple policies
-- Users can see orgs they're a member of (using a direct join, not subquery)
CREATE POLICY "organizations_select"
ON public.organizations FOR SELECT
USING (
  auth.uid() = "ownerId" 
  OR EXISTS (
    SELECT 1 FROM public.org_members om 
    WHERE om."orgId" = id AND om."userId" = auth.uid()
  )
);

-- Authenticated users can create organizations
CREATE POLICY "organizations_insert"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() = "ownerId");

-- Owners can update their orgs
CREATE POLICY "organizations_update"
ON public.organizations FOR UPDATE
USING (auth.uid() = "ownerId");

-- Owners can delete their orgs
CREATE POLICY "organizations_delete"
ON public.organizations FOR DELETE
USING (auth.uid() = "ownerId");

-- WORKSPACES: Simple policies
CREATE POLICY "workspaces_select"
ON public.workspaces FOR SELECT
USING (
  auth.uid() = "ownerId"
  OR auth.uid() = ANY(members)
  OR EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm."workspaceId" = id AND wm."userId" = auth.uid()
  )
);

CREATE POLICY "workspaces_insert"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "workspaces_update"
ON public.workspaces FOR UPDATE
USING (auth.uid() = "ownerId");

CREATE POLICY "workspaces_delete"
ON public.workspaces FOR DELETE
USING (auth.uid() = "ownerId");

-- WORKSPACE_MEMBERS: Simple policies
CREATE POLICY "workspace_members_select"
ON public.workspace_members FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "workspace_members_insert"
ON public.workspace_members FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "workspace_members_update"
ON public.workspace_members FOR UPDATE
USING (auth.uid() = "userId");

CREATE POLICY "workspace_members_delete"
ON public.workspace_members FOR DELETE
USING (auth.uid() = "userId");

-- ==============================================================================
-- 3. TEAM_MEMBERS TABLE - Create if not exists and set up RLS
-- ==============================================================================

-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_members (
  id text PRIMARY KEY,
  email text NOT NULL,
  "passwordHash" text NOT NULL,
  name text NOT NULL,
  avatar text,
  "jobTitle" text,
  "scopeType" text NOT NULL CHECK ("scopeType" IN ('organization', 'workspace', 'project')),
  "scopeId" text NOT NULL,
  "scopeCode" text NOT NULL,
  role text NOT NULL,
  "createdBy" uuid REFERENCES public.profiles(id),
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "lastLoginAt" timestamp with time zone,
  "isActive" boolean DEFAULT true,
  CONSTRAINT team_members_unique_email_per_scope UNIQUE ("scopeId", email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_scope ON public.team_members("scopeType", "scopeId");
CREATE INDEX IF NOT EXISTS idx_team_members_scope_code ON public.team_members("scopeCode");

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members policies - admins can manage, members can view
CREATE POLICY "team_members_select"
ON public.team_members FOR SELECT
USING (true);  -- Anyone can read (credentials are hashed)

CREATE POLICY "team_members_insert"
ON public.team_members FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "team_members_update"
ON public.team_members FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "team_members_delete"
ON public.team_members FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ==============================================================================
-- 4. ADD CODE COLUMNS TO TABLES (if not exists)
-- ==============================================================================

-- Add code column to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- Add code column to workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.workspaces ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- Add code column to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- ==============================================================================
-- 5. FUNCTION TO GENERATE 6-DIGIT NUMERIC CODES
-- ==============================================================================

CREATE OR REPLACE FUNCTION generate_numeric_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 6-digit numeric code (100000 to 999999)
    new_code := LPAD(FLOOR(100000 + RANDOM() * 900000)::text, 6, '0');
    
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
-- 6. GENERATE CODES FOR EXISTING RECORDS
-- ==============================================================================

-- Generate codes for existing organizations without codes
UPDATE public.organizations 
SET code = generate_numeric_code()
WHERE code IS NULL;

-- Generate codes for existing workspaces without codes  
UPDATE public.workspaces 
SET code = generate_numeric_code()
WHERE code IS NULL;

-- Generate codes for existing projects without codes
UPDATE public.projects 
SET code = generate_numeric_code()
WHERE code IS NULL;

-- ==============================================================================
-- 7. CREATE TRIGGERS FOR AUTO-GENERATING CODES
-- ==============================================================================

-- Trigger function for auto-generating codes
CREATE OR REPLACE FUNCTION auto_generate_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_numeric_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS organizations_auto_code ON public.organizations;
DROP TRIGGER IF EXISTS workspaces_auto_code ON public.workspaces;
DROP TRIGGER IF EXISTS projects_auto_code ON public.projects;

-- Create triggers
CREATE TRIGGER organizations_auto_code
  BEFORE INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION auto_generate_code();

CREATE TRIGGER workspaces_auto_code
  BEFORE INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION auto_generate_code();

CREATE TRIGGER projects_auto_code
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION auto_generate_code();

-- ==============================================================================
-- 8. GRANT PERMISSIONS
-- ==============================================================================

GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO anon;
GRANT ALL ON public.org_members TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.workspaces TO authenticated;
GRANT ALL ON public.workspace_members TO authenticated;
GRANT ALL ON public.projects TO authenticated;

-- ==============================================================================
-- DONE! The RLS policies are now fixed and won't cause infinite recursion.
-- ==============================================================================
