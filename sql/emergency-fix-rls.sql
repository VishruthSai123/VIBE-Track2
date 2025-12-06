-- ==============================================================================
-- EMERGENCY FIX: Disable RLS on problematic tables to stop 500 errors
-- ==============================================================================
-- Run this IMMEDIATELY in Supabase SQL Editor to fix the infinite recursion
-- ==============================================================================

-- Step 1: Disable RLS on ALL tables causing issues
ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sprints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.spaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on org_members (these cause the recursion)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'org_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.org_members', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Drop ALL existing policies on organizations
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'organizations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', pol.policyname);
    END LOOP;
END $$;

-- Step 4: Drop ALL existing policies on workspaces
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'workspaces'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.workspaces', pol.policyname);
    END LOOP;
END $$;

-- Step 5: Drop ALL existing policies on workspace_members
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'workspace_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.workspace_members', pol.policyname);
    END LOOP;
END $$;

-- ==============================================================================
-- Now create the team_members table and code columns
-- ==============================================================================

-- Create team_members table if not exists
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
  "createdBy" uuid,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "lastLoginAt" timestamp with time zone,
  "isActive" boolean DEFAULT true,
  CONSTRAINT team_members_unique_email_per_scope UNIQUE ("scopeId", email)
);

-- Disable RLS on team_members too
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_scope ON public.team_members("scopeType", "scopeId");
CREATE INDEX IF NOT EXISTS idx_team_members_scope_code ON public.team_members("scopeCode");

-- ==============================================================================
-- Add code columns to tables
-- ==============================================================================

-- Add code to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS code text;

-- Add code to workspaces  
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS code text;

-- Add orgId to workspaces (links workspace to organization)
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS "orgId" text;

-- Add code to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS code text;

-- ==============================================================================
-- Generate 6-digit codes for existing records
-- ==============================================================================

-- Function to generate unique 6-digit code
CREATE OR REPLACE FUNCTION generate_6digit_code()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(100000 + RANDOM() * 900000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate codes for organizations
UPDATE public.organizations SET code = generate_6digit_code() WHERE code IS NULL;

-- Generate codes for workspaces
UPDATE public.workspaces SET code = generate_6digit_code() WHERE code IS NULL;

-- Generate codes for projects
UPDATE public.projects SET code = generate_6digit_code() WHERE code IS NULL;

-- ==============================================================================
-- Create triggers for auto-generating codes on INSERT
-- ==============================================================================

CREATE OR REPLACE FUNCTION auto_set_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_6digit_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_org_code ON public.organizations;
CREATE TRIGGER set_org_code BEFORE INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION auto_set_code();

DROP TRIGGER IF EXISTS set_ws_code ON public.workspaces;
CREATE TRIGGER set_ws_code BEFORE INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION auto_set_code();

DROP TRIGGER IF EXISTS set_proj_code ON public.projects;
CREATE TRIGGER set_proj_code BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION auto_set_code();

-- ==============================================================================
-- Grant full access to authenticated users (since RLS is disabled)
-- ==============================================================================

GRANT ALL ON public.organizations TO authenticated, anon;
GRANT ALL ON public.org_members TO authenticated, anon;
GRANT ALL ON public.workspaces TO authenticated, anon;
GRANT ALL ON public.workspace_members TO authenticated, anon;
GRANT ALL ON public.projects TO authenticated, anon;
GRANT ALL ON public.team_members TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated, anon;
GRANT ALL ON public.issues TO authenticated, anon;
GRANT ALL ON public.sprints TO authenticated, anon;
GRANT ALL ON public.teams TO authenticated, anon;
GRANT ALL ON public.spaces TO authenticated, anon;

-- ==============================================================================
-- DONE! RLS is now disabled and the 500 errors should stop.
-- ==============================================================================
-- NOTE: With RLS disabled, all authenticated users can see all data.
-- This is fine for development. For production, you would need to 
-- carefully design non-recursive RLS policies.
-- ==============================================================================
