-- ============================================================
-- VIBE-TRACK PROJECT SPACES SYSTEM - COMPLETE SQL SCRIPT
-- ============================================================
-- Run this in Supabase SQL Editor in order from top to bottom
-- This uses camelCase column names (with double quotes) to match
-- the existing database schema convention.
-- ============================================================


-- ============================================================
-- 1. UPDATE SPACES TABLE (Add new columns if needed)
-- ============================================================
-- First, check if spaces table exists and add missing columns

DO $$ 
BEGIN
    -- Add workflow column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'spaces' AND column_name = 'workflow'
    ) THEN
        ALTER TABLE spaces ADD COLUMN workflow JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add color column if not exists  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'spaces' AND column_name = 'color'
    ) THEN
        ALTER TABLE spaces ADD COLUMN color TEXT;
    END IF;
    
    -- Add updatedAt column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'spaces' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE spaces ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add deletedAt column if not exists (for soft delete)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'spaces' AND column_name = 'deletedAt'
    ) THEN
        ALTER TABLE spaces ADD COLUMN "deletedAt" TIMESTAMPTZ DEFAULT NULL;
    END IF;
    
    -- Add icon column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'spaces' AND column_name = 'icon'
    ) THEN
        ALTER TABLE spaces ADD COLUMN icon TEXT;
    END IF;
END $$;

-- Update type constraint to include more space types
DO $$
BEGIN
    ALTER TABLE spaces DROP CONSTRAINT IF EXISTS spaces_type_check;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE spaces ADD CONSTRAINT spaces_type_check 
    CHECK (type IN ('development', 'frontend', 'backend', 'design', 'qa', 'marketing', 'growth', 'ai_research', 'general'));

-- Create indexes for spaces
CREATE INDEX IF NOT EXISTS idx_spaces_project ON spaces("projectId");
CREATE INDEX IF NOT EXISTS idx_spaces_created_by ON spaces("createdBy");
CREATE INDEX IF NOT EXISTS idx_spaces_type ON spaces(type);
CREATE INDEX IF NOT EXISTS idx_spaces_deleted ON spaces("deletedAt");

COMMENT ON TABLE spaces IS 'Spaces are sub-sections within projects for organizing work streams';
COMMENT ON COLUMN spaces."deletedAt" IS 'Soft delete timestamp - NULL means active, non-NULL means deleted';


-- ============================================================
-- 2. SPACE MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS space_members (
    "userId" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    "spaceId" TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
    "addedBy" UUID REFERENCES profiles(id),
    PRIMARY KEY ("userId", "spaceId")
);

-- Indexes for space_members
CREATE INDEX IF NOT EXISTS idx_space_members_space ON space_members("spaceId");
CREATE INDEX IF NOT EXISTS idx_space_members_user ON space_members("userId");

COMMENT ON TABLE space_members IS 'Tracks which users have access to which spaces';


-- ============================================================
-- 3. UPDATE SPACE PERMISSIONS TABLE (Add missing columns)
-- ============================================================
DO $$ 
BEGIN
    -- Add canView column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'space_permissions' AND column_name = 'canView'
    ) THEN
        ALTER TABLE space_permissions ADD COLUMN "canView" BOOLEAN DEFAULT true;
    END IF;
    
    -- Add canManageMembers column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'space_permissions' AND column_name = 'canManageMembers'
    ) THEN
        ALTER TABLE space_permissions ADD COLUMN "canManageMembers" BOOLEAN DEFAULT false;
    END IF;
    
    -- Add updatedAt column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'space_permissions' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE space_permissions ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for space_permissions
CREATE INDEX IF NOT EXISTS idx_space_permissions_space ON space_permissions("spaceId");
CREATE INDEX IF NOT EXISTS idx_space_permissions_user ON space_permissions("userId");

COMMENT ON TABLE space_permissions IS 'Fine-grained permissions per user per space, controlled by Founder';


-- ============================================================
-- 4. UPDATE ACTIVITIES TABLE (Add missing columns)
-- ============================================================
DO $$ 
BEGIN
    -- Add projectId column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'projectId'
    ) THEN
        ALTER TABLE activities ADD COLUMN "projectId" TEXT REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
    
    -- Add entityType column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'entityType'
    ) THEN
        ALTER TABLE activities ADD COLUMN "entityType" TEXT;
    END IF;
    
    -- Add entityId column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'entityId'
    ) THEN
        ALTER TABLE activities ADD COLUMN "entityId" TEXT;
    END IF;
    
    -- Add metadata column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE activities ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_space ON activities("spaceId");
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities("projectId");
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities("userId");
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities("entityType", "entityId");

COMMENT ON TABLE activities IS 'Audit log of all actions within spaces for full transparency';


-- ============================================================
-- 5. UPDATE NOTIFICATIONS TABLE FOR SPACE NOTIFICATIONS
-- ============================================================
DO $$ 
BEGIN
    -- Add spaceId if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'spaceId'
    ) THEN
        ALTER TABLE notifications ADD COLUMN "spaceId" TEXT REFERENCES spaces(id) ON DELETE CASCADE;
    END IF;
    
    -- Add entityId if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'entityId'
    ) THEN
        ALTER TABLE notifications ADD COLUMN "entityId" TEXT;
    END IF;
    
    -- Add entityType if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'entityType'
    ) THEN
        ALTER TABLE notifications ADD COLUMN "entityType" TEXT;
    END IF;
END $$;

-- Update type check constraint for notifications
DO $$
BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('ASSIGNMENT', 'COMMENT', 'SYSTEM', 'SPACE_INVITE', 'PERMISSION_CHANGE', 'SPRINT_UPDATE', 'TASK_UPDATE'));


-- ============================================================
-- 6. FUNCTION: Auto-update updatedAt timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to spaces
DROP TRIGGER IF EXISTS update_spaces_updated_at ON spaces;
CREATE TRIGGER update_spaces_updated_at
    BEFORE UPDATE ON spaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to space_permissions
DROP TRIGGER IF EXISTS update_space_permissions_updated_at ON space_permissions;
CREATE TRIGGER update_space_permissions_updated_at
    BEFORE UPDATE ON space_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 7. FUNCTION: Create default spaces when project is created
-- ============================================================
CREATE OR REPLACE FUNCTION create_default_spaces()
RETURNS TRIGGER AS $$
BEGIN
    -- Development Space
    INSERT INTO spaces (id, "projectId", name, type, description, "createdBy", "createdAt")
    VALUES (
        'spc-' || gen_random_uuid()::text,
        NEW.id,
        'Development',
        'development',
        'Core development tasks and features',
        NEW."leadId"
    , NOW());
    
    -- Design Space
    INSERT INTO spaces (id, "projectId", name, type, description, "createdBy", "createdAt")
    VALUES (
        'spc-' || gen_random_uuid()::text,
        NEW.id,
        'Design',
        'design',
        'UI/UX design tasks',
        NEW."leadId"
    , NOW());
    
    -- QA Space
    INSERT INTO spaces (id, "projectId", name, type, description, "createdBy", "createdAt")
    VALUES (
        'spc-' || gen_random_uuid()::text,
        NEW.id,
        'QA',
        'qa',
        'Quality assurance and testing',
        NEW."leadId"
    , NOW());
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If trigger fails, don't block project creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create default spaces for new projects
DROP TRIGGER IF EXISTS create_project_default_spaces ON projects;
CREATE TRIGGER create_project_default_spaces
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_spaces();


-- ============================================================
-- 8. FUNCTION: Log activity automatically on space changes
-- ============================================================
CREATE OR REPLACE FUNCTION log_space_activity()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    details_text TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        action_type := 'space_created';
        details_text := 'Created space "' || NEW.name || '"';
        
        INSERT INTO activities (id, "spaceId", "projectId", "userId", action, "entityType", "entityId", details, "createdAt")
        VALUES (
            'act-' || gen_random_uuid()::text,
            NEW.id,
            NEW."projectId",
            NEW."createdBy",
            action_type,
            'space',
            NEW.id,
            details_text,
            NOW()
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check for soft delete
        IF OLD."deletedAt" IS NULL AND NEW."deletedAt" IS NOT NULL THEN
            action_type := 'space_deleted';
            details_text := 'Deleted space "' || NEW.name || '"';
        ELSIF OLD."deletedAt" IS NOT NULL AND NEW."deletedAt" IS NULL THEN
            action_type := 'space_restored';
            details_text := 'Restored space "' || NEW.name || '"';
        ELSE
            action_type := 'space_updated';
            details_text := 'Updated space "' || NEW.name || '"';
        END IF;
        
        INSERT INTO activities (id, "spaceId", "projectId", "userId", action, "entityType", "entityId", details, "createdAt")
        VALUES (
            'act-' || gen_random_uuid()::text,
            NEW.id,
            NEW."projectId",
            NEW."createdBy",
            action_type,
            'space',
            NEW.id,
            details_text,
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Log space activities
DROP TRIGGER IF EXISTS log_space_changes ON spaces;
CREATE TRIGGER log_space_changes
    AFTER INSERT OR UPDATE ON spaces
    FOR EACH ROW
    EXECUTE FUNCTION log_space_activity();


-- ============================================================
-- 9. FUNCTION: Send notification when user is added to space
-- ============================================================
CREATE OR REPLACE FUNCTION notify_space_member()
RETURNS TRIGGER AS $$
DECLARE
    space_name TEXT;
BEGIN
    SELECT name INTO space_name FROM spaces WHERE id = NEW."spaceId";
    
    INSERT INTO notifications (id, "userId", title, message, read, type, "spaceId", created_at)
    VALUES (
        'notif-' || gen_random_uuid()::text,
        NEW."userId",
        'Added to Space',
        'You have been added to the "' || COALESCE(space_name, 'Unknown') || '" space',
        false,
        'SPACE_INVITE',
        NEW."spaceId",
        NOW()
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Notify on space member addition
DROP TRIGGER IF EXISTS notify_on_space_member_add ON space_members;
CREATE TRIGGER notify_on_space_member_add
    AFTER INSERT ON space_members
    FOR EACH ROW
    EXECUTE FUNCTION notify_space_member();


-- ============================================================
-- 10. VIEW: Space statistics (tasks, completion, velocity)
-- ============================================================
DROP VIEW IF EXISTS space_stats;
CREATE VIEW space_stats AS
SELECT 
    s.id AS "spaceId",
    s.name AS "spaceName",
    s."projectId",
    s.type,
    COUNT(i.id) AS "totalTasks",
    COUNT(CASE WHEN i.status = 'DONE' THEN 1 END) AS "completedTasks",
    COUNT(CASE WHEN i.status = 'IN_PROGRESS' THEN 1 END) AS "inProgressTasks",
    COALESCE(SUM(i."storyPoints"), 0) AS "totalStoryPoints",
    COALESCE(SUM(CASE WHEN i.status = 'DONE' THEN i."storyPoints" ELSE 0 END), 0) AS "completedStoryPoints",
    ROUND(
        CASE 
            WHEN COUNT(i.id) > 0 THEN (COUNT(CASE WHEN i.status = 'DONE' THEN 1 END)::numeric / COUNT(i.id)) * 100
            ELSE 0
        END, 
        2
    ) AS "completionRate"
FROM spaces s
LEFT JOIN issues i ON i."spaceId" = s.id
WHERE s."deletedAt" IS NULL
GROUP BY s.id, s.name, s."projectId", s.type;

COMMENT ON VIEW space_stats IS 'Aggregated statistics per space for dashboards and reports';


-- ============================================================
-- 11. VIEW: Recent space activities (last 100)
-- ============================================================
DROP VIEW IF EXISTS recent_activities;
CREATE VIEW recent_activities AS
SELECT 
    a.*,
    p.name AS "userName",
    p.avatar AS "userAvatar",
    s.name AS "spaceName"
FROM activities a
JOIN profiles p ON a."userId" = p.id
JOIN spaces s ON a."spaceId" = s.id
ORDER BY a."createdAt" DESC
LIMIT 100;

COMMENT ON VIEW recent_activities IS 'Recent activity feed with user and space info';


-- ============================================================
-- 12. FUNCTION: Get user permissions for a space
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_space_permissions(
    p_user_id UUID,
    p_space_id TEXT
)
RETURNS TABLE (
    "canView" BOOLEAN,
    "canCreateTasks" BOOLEAN,
    "canEditTasks" BOOLEAN,
    "canDeleteTasks" BOOLEAN,
    "canManageBoard" BOOLEAN,
    "canManageSprints" BOOLEAN,
    "canEditSpace" BOOLEAN,
    "canDeleteSpace" BOOLEAN,
    "canManageMembers" BOOLEAN
) AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user's role
    SELECT role INTO user_role FROM profiles WHERE id = p_user_id;
    
    -- Founder always has full access
    IF user_role = 'Founder' THEN
        RETURN QUERY SELECT true, true, true, true, true, true, true, true, true;
        RETURN;
    END IF;
    
    -- Check specific permissions
    RETURN QUERY
    SELECT 
        COALESCE(sp."canView", true),
        COALESCE(sp."canCreateTasks", false),
        COALESCE(sp."canEditTasks", false),
        COALESCE(sp."canDeleteTasks", false),
        COALESCE(sp."canManageBoard", false),
        COALESCE(sp."canManageSprints", false),
        COALESCE(sp."canEditSpace", false),
        COALESCE(sp."canDeleteSpace", false),
        COALESCE(sp."canManageMembers", false)
    FROM space_permissions sp
    WHERE sp."userId" = p_user_id AND sp."spaceId" = p_space_id;
    
    -- If no permissions found, return defaults based on role
    IF NOT FOUND THEN
        CASE user_role
            WHEN 'CTO' THEN
                RETURN QUERY SELECT true, true, true, false, true, true, true, false, true;
            WHEN 'CAO' THEN
                RETURN QUERY SELECT true, true, true, false, true, true, true, false, true;
            WHEN 'Admin' THEN
                RETURN QUERY SELECT true, true, true, false, true, true, false, false, false;
            WHEN 'Team Lead' THEN
                RETURN QUERY SELECT true, true, true, false, true, true, false, false, false;
            WHEN 'Product Manager' THEN
                RETURN QUERY SELECT true, true, true, false, true, true, false, false, false;
            WHEN 'Developer' THEN
                RETURN QUERY SELECT true, true, true, false, false, false, false, false, false;
            WHEN 'Designer' THEN
                RETURN QUERY SELECT true, true, false, false, false, false, false, false, false;
            WHEN 'QA Engineer' THEN
                RETURN QUERY SELECT true, true, true, false, false, false, false, false, false;
            ELSE
                RETURN QUERY SELECT true, false, false, false, false, false, false, false, false;
        END CASE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 13. FUNCTION: Get sprint velocity by space
-- ============================================================
CREATE OR REPLACE FUNCTION get_sprint_velocity_by_space(p_sprint_id TEXT)
RETURNS TABLE (
    "spaceId" TEXT,
    "spaceName" TEXT,
    "totalTasks" BIGINT,
    "completedTasks" BIGINT,
    "storyPoints" NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS "spaceId",
        s.name AS "spaceName",
        COUNT(i.id) AS "totalTasks",
        COUNT(CASE WHEN i.status = 'DONE' THEN 1 END) AS "completedTasks",
        COALESCE(SUM(CASE WHEN i.status = 'DONE' THEN i."storyPoints" ELSE 0 END), 0) AS "storyPoints"
    FROM spaces s
    LEFT JOIN issues i ON i."spaceId" = s.id AND i."sprintId" = p_sprint_id
    WHERE s."deletedAt" IS NULL
    GROUP BY s.id, s.name
    ORDER BY "storyPoints" DESC;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 14. REALTIME: Enable realtime for spaces tables
-- ============================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE spaces;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE space_members;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE space_permissions;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE activities;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;


-- ============================================================
-- 15. GRANTS: Ensure authenticated users can access
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON spaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON space_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON space_permissions TO authenticated;
GRANT SELECT, INSERT ON activities TO authenticated;
GRANT SELECT ON space_stats TO authenticated;
GRANT SELECT ON recent_activities TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_space_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION get_sprint_velocity_by_space TO authenticated;


-- ============================================================
-- DONE! Your Spaces system is now fully set up.
-- ============================================================
-- 
-- Summary of what was created/updated:
-- 
-- TABLE UPDATES:
--   - spaces: Added workflow, color, updatedAt, deletedAt, icon columns
--   - space_permissions: Added canView, canManageMembers, updatedAt columns
--   - activities: Added projectId, entityType, entityId, metadata columns
--   - notifications: Added spaceId, entityId, entityType columns
-- 
-- NEW TABLE:
--   - space_members: Tracks space membership
-- 
-- TRIGGERS:
--   - Auto-update updatedAt on changes
--   - Auto-create default spaces (Development, Design, QA) for new projects
--   - Auto-log space activities
--   - Auto-notify when user is added to space
-- 
-- FUNCTIONS:
--   - get_user_space_permissions(): Get computed permissions for a user
--   - get_sprint_velocity_by_space(): Get sprint velocity breakdown by space
-- 
-- VIEWS:
--   - space_stats: Aggregated stats per space
--   - recent_activities: Activity feed with user/space info
-- 
-- ============================================================
