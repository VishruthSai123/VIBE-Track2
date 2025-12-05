-- ==============================================================================
-- VIBETRACK ORGANIZATION & MULTI-TENANT AUTHORIZATION MIGRATION
-- ==============================================================================
-- This migration adds:
-- 1. Organizations table (multi-tenant layer)
-- 2. Organization Members with roles
-- 3. Workspace Members with roles (enhanced)
-- 4. Invites system
-- 5. Updates to existing tables for org support
-- ==============================================================================

-- ==============================================================================
-- 1. ORGANIZATIONS TABLE
-- ==============================================================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  "ownerId" uuid REFERENCES public.profiles(id),
  logo text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  "billingEmail" text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations("ownerId");

-- ==============================================================================
-- 2. ORGANIZATION MEMBERS TABLE
-- ==============================================================================

-- Create org_members table
CREATE TABLE IF NOT EXISTS public.org_members (
  "orgId" text REFERENCES public.organizations(id) ON DELETE CASCADE,
  "userId" uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Member' CHECK (role IN ('Founder', 'Admin', 'Manager', 'Member', 'Viewer')),
  "joinedAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "invitedBy" uuid REFERENCES public.profiles(id),
  PRIMARY KEY ("orgId", "userId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members("userId");
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.org_members("orgId");

-- ==============================================================================
-- 3. WORKSPACE MEMBERS TABLE (Enhanced)
-- ==============================================================================

-- Create workspace_members table (separate from the members array)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  "workspaceId" text REFERENCES public.workspaces(id) ON DELETE CASCADE,
  "userId" uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Workspace Member' CHECK (role IN ('Workspace Admin', 'Workspace Manager', 'Workspace Member', 'Workspace Viewer')),
  "joinedAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "invitedBy" uuid REFERENCES public.profiles(id),
  PRIMARY KEY ("workspaceId", "userId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members("userId");
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members("workspaceId");

-- ==============================================================================
-- 4. SPACE MEMBERS TABLE
-- ==============================================================================

-- Create space_members table if not exists
CREATE TABLE IF NOT EXISTS public.space_members (
  "spaceId" text REFERENCES public.spaces(id) ON DELETE CASCADE,
  "userId" uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'Space Contributor' CHECK (role IN ('Space Owner', 'Space Contributor', 'Space Viewer')),
  "canEdit" boolean DEFAULT true,
  "canManage" boolean DEFAULT false,
  "addedAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "addedBy" uuid REFERENCES public.profiles(id),
  PRIMARY KEY ("spaceId", "userId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_space_members_user ON public.space_members("userId");
CREATE INDEX IF NOT EXISTS idx_space_members_space ON public.space_members("spaceId");

-- ==============================================================================
-- 5. INVITES TABLE
-- ==============================================================================

-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id text PRIMARY KEY,
  email text NOT NULL,
  type text NOT NULL CHECK (type IN ('organization', 'workspace', 'space')),
  "targetId" text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token text UNIQUE NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "invitedBy" uuid REFERENCES public.profiles(id),
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "acceptedAt" timestamp with time zone
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_target ON public.invites("targetId", type);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);

-- ==============================================================================
-- 6. UPDATE EXISTING TABLES - ADD ORG REFERENCE TO WORKSPACES
-- ==============================================================================

-- Add orgId column to workspaces if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspaces' AND column_name = 'orgId'
  ) THEN
    ALTER TABLE public.workspaces ADD COLUMN "orgId" text REFERENCES public.organizations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_workspaces_org ON public.workspaces("orgId");
  END IF;
END $$;

-- ==============================================================================
-- 7. UPDATE PROFILES - ADD ORG IDS
-- ==============================================================================

-- Add orgIds column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'orgIds'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN "orgIds" text[] DEFAULT array[]::text[];
  END IF;
END $$;

-- ==============================================================================
-- 8. UPDATE NOTIFICATIONS TABLE - ADD NEW TYPES
-- ==============================================================================

-- Drop and recreate the type constraint to add INVITE and SPACE_INVITE
DO $$
BEGIN
  -- First, update any existing rows that might violate the new constraint
  UPDATE public.notifications 
  SET type = 'SYSTEM' 
  WHERE type NOT IN ('ASSIGNMENT', 'COMMENT', 'SYSTEM', 'INVITE', 'SPACE_INVITE');
  
  -- Drop the old constraint
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  -- Add the new constraint with more types
  ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('ASSIGNMENT', 'COMMENT', 'SYSTEM', 'INVITE', 'SPACE_INVITE', 'MENTION'));
END $$;

-- Add spaceId to notifications if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'spaceId'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN "spaceId" text REFERENCES public.spaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==============================================================================
-- 9. UPDATE ACTIVITIES TABLE - ADD ENTITY TRACKING
-- ==============================================================================

-- Add projectId if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'projectId'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN "projectId" text REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add entityType if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'entityType'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN "entityType" text DEFAULT 'space';
  END IF;
END $$;

-- Add entityId if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'entityId'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN "entityId" text;
  END IF;
END $$;

-- ==============================================================================
-- 10. UPDATE SPACE PERMISSIONS - ADD ROLE COLUMN
-- ==============================================================================

-- Add role column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'space_permissions' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.space_permissions ADD COLUMN role text DEFAULT 'Space Contributor';
  END IF;
END $$;

-- Add updatedAt column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'space_permissions' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE public.space_permissions ADD COLUMN "updatedAt" timestamp with time zone DEFAULT timezone('utc'::text, now());
  END IF;
END $$;

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Org members can view organization" ON public.organizations;
DROP POLICY IF EXISTS "Founders can update organization" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org members can view members" ON public.org_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON public.org_members;
DROP POLICY IF EXISTS "Workspace members can view membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can manage workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Space members can view membership" ON public.space_members;
DROP POLICY IF EXISTS "Users can view their invites" ON public.invites;
DROP POLICY IF EXISTS "Inviters can manage invites" ON public.invites;

-- ORGANIZATIONS POLICIES
CREATE POLICY "Org members can view organization" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE org_members."orgId" = organizations.id 
      AND org_members."userId" = auth.uid()
    )
  );

CREATE POLICY "Founders can update organization" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE org_members."orgId" = organizations.id 
      AND org_members."userId" = auth.uid()
      AND org_members.role IN ('Founder', 'Admin')
    )
  );

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ORG_MEMBERS POLICIES
CREATE POLICY "Org members can view members" ON public.org_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members AS om 
      WHERE om."orgId" = org_members."orgId" 
      AND om."userId" = auth.uid()
    )
  );

CREATE POLICY "Admins can manage org members" ON public.org_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members AS om 
      WHERE om."orgId" = org_members."orgId" 
      AND om."userId" = auth.uid()
      AND om.role IN ('Founder', 'Admin')
    )
  );

-- WORKSPACE_MEMBERS POLICIES
CREATE POLICY "Workspace members can view membership" ON public.workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members AS wm 
      WHERE wm."workspaceId" = workspace_members."workspaceId" 
      AND wm."userId" = auth.uid()
    )
  );

CREATE POLICY "Admins can manage workspace members" ON public.workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members AS wm 
      WHERE wm."workspaceId" = workspace_members."workspaceId" 
      AND wm."userId" = auth.uid()
      AND wm.role IN ('Workspace Admin')
    ) OR EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.org_members om ON om."orgId" = w."orgId"
      WHERE w.id = workspace_members."workspaceId"
      AND om."userId" = auth.uid()
      AND om.role IN ('Founder', 'Admin')
    )
  );

-- SPACE_MEMBERS POLICIES
CREATE POLICY "Space members can view membership" ON public.space_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.space_members AS sm 
      WHERE sm."spaceId" = space_members."spaceId" 
      AND sm."userId" = auth.uid()
    )
  );

-- INVITES POLICIES
CREATE POLICY "Users can view their invites" ON public.invites
  FOR SELECT USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR "invitedBy" = auth.uid()
  );

CREATE POLICY "Inviters can manage invites" ON public.invites
  FOR ALL USING (
    "invitedBy" = auth.uid()
  );

-- ==============================================================================
-- 12. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to expire old invites
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE public.invites 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND "expiresAt" < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 13. GRANT PERMISSIONS
-- ==============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;

-- Grant sequence usage if needed
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- Run this script in your Supabase SQL editor
-- All operations are idempotent (safe to re-run)
-- ==============================================================================
