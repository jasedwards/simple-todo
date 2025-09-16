# Database Schema

Transforming the conceptual data models into a concrete PostgreSQL schema optimized for both transactional task management and complex analytics queries. The schema supports the BMad methodology demonstration requirements while ensuring sub-100ms analytics performance.

```sql
-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search for decision logs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table with role-based collaboration tracking
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('developer', 'qa', 'leadership', 'business', 'pm')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',

    -- Indexes for authentication and collaboration queries
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Tasks table with enhanced status tracking and analytics support
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'stuck', 'completed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_minutes INTEGER CHECK (estimated_minutes > 0),
    actual_minutes INTEGER CHECK (actual_minutes > 0),
    tags TEXT[] DEFAULT '{}',

    -- Analytics optimization
    analytics_context JSONB DEFAULT '{}',

    -- Constraints
    CONSTRAINT tasks_completion_logic CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- Indexes for task queries and analytics
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_status_updated ON tasks(status, updated_at);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_tasks_analytics_context ON tasks USING GIN(analytics_context);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);

-- Status changes for completion time analytics and behavioral patterns
CREATE TABLE status_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_status VARCHAR(50) CHECK (from_status IN ('not_started', 'in_progress', 'stuck', 'completed')),
    to_status VARCHAR(50) NOT NULL CHECK (to_status IN ('not_started', 'in_progress', 'stuck', 'completed')),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms BIGINT CHECK (duration_ms >= 0),
    notes TEXT,
    context JSONB DEFAULT '{}',

    -- Prevent invalid status transitions
    CONSTRAINT status_changes_transition_check CHECK (from_status != to_status)
);

-- Indexes for analytics queries
CREATE INDEX idx_status_changes_task_time ON status_changes(task_id, changed_at);
CREATE INDEX idx_status_changes_user_time ON status_changes(user_id, changed_at);
CREATE INDEX idx_status_changes_duration ON status_changes(duration_ms) WHERE duration_ms IS NOT NULL;
CREATE INDEX idx_status_changes_to_status ON status_changes(to_status, changed_at);
CREATE INDEX idx_status_changes_context ON status_changes USING GIN(context);

-- Decisions table for collaborative planning demonstration
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('architecture', 'technology', 'process', 'ux_design', 'methodology')),
    status VARCHAR(50) NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed', 'under_discussion', 'approved', 'implemented', 'revisited')),
    proposed_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    impact TEXT,
    alternatives TEXT,
    tags TEXT[] DEFAULT '{}',

    -- Full-text search support
    search_vector tsvector,

    -- Methodology tracking
    methodology_metrics JSONB DEFAULT '{}',

    CONSTRAINT decisions_approval_logic CHECK (
        (status IN ('approved', 'implemented') AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
        (status NOT IN ('approved', 'implemented'))
    )
);

-- Indexes for decision queries and search
CREATE INDEX idx_decisions_category_status ON decisions(category, status);
CREATE INDEX idx_decisions_proposed_by ON decisions(proposed_by, created_at);
CREATE INDEX idx_decisions_approved_by ON decisions(approved_by, approved_at);
CREATE INDEX idx_decisions_search ON decisions USING GIN(search_vector);
CREATE INDEX idx_decisions_tags ON decisions USING GIN(tags);
CREATE INDEX idx_decisions_created_at ON decisions(created_at);

-- Decision inputs for stakeholder attribution
CREATE TABLE decision_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input_type VARCHAR(50) NOT NULL CHECK (input_type IN ('suggestion', 'concern', 'approval', 'question', 'alternative')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agreement_level INTEGER CHECK (agreement_level >= 1 AND agreement_level <= 5),
    expertise_areas TEXT[] DEFAULT '{}' CHECK (
        expertise_areas <@ ARRAY['frontend', 'backend', 'database', 'testing', 'security', 'performance', 'ux']
    ),

    -- Prevent duplicate inputs from same user
    UNIQUE(decision_id, user_id, input_type, created_at)
);

-- Indexes for stakeholder attribution queries
CREATE INDEX idx_decision_inputs_decision_time ON decision_inputs(decision_id, created_at);
CREATE INDEX idx_decision_inputs_user_type ON decision_inputs(user_id, input_type);
CREATE INDEX idx_decision_inputs_agreement ON decision_inputs(agreement_level, created_at);

-- Analytics summary table for dashboard performance
CREATE TABLE analytics_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    summary_type VARCHAR(50) NOT NULL CHECK (summary_type IN ('daily', 'weekly', 'monthly')),
    metrics JSONB NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate summaries
    UNIQUE(user_id, date_range_start, date_range_end, summary_type)
);

CREATE INDEX idx_analytics_summaries_user_date ON analytics_summaries(user_id, date_range_start, date_range_end);
CREATE INDEX idx_analytics_summaries_type ON analytics_summaries(summary_type, computed_at);

-- Trigger to update search vector for decisions
CREATE OR REPLACE FUNCTION update_decision_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.impact, '') || ' ' ||
        COALESCE(NEW.alternatives, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decision_search_update
    BEFORE INSERT OR UPDATE ON decisions
    FOR EACH ROW EXECUTE FUNCTION update_decision_search_vector();

-- Trigger to automatically update task updated_at
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_updated_at_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_task_updated_at();

-- Function to calculate actual minutes from status changes
CREATE OR REPLACE FUNCTION calculate_task_duration(task_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_minutes INTEGER := 0;
    duration_sum BIGINT;
BEGIN
    -- Sum all durations where task moved to 'completed' status
    SELECT COALESCE(SUM(duration_ms), 0) INTO duration_sum
    FROM status_changes
    WHERE task_id = task_uuid
    AND to_status = 'completed';

    -- Convert milliseconds to minutes
    total_minutes := ROUND(duration_sum / 60000.0);

    RETURN total_minutes;
END;
$$ LANGUAGE plpgsql;

-- View for analytics dashboard queries
CREATE VIEW task_analytics AS
SELECT
    t.id,
    t.user_id,
    t.status,
    t.priority,
    t.created_at,
    t.completed_at,
    t.estimated_minutes,
    calculate_task_duration(t.id) as actual_minutes,
    EXTRACT(epoch FROM (t.completed_at - t.created_at)) / 60 as total_minutes,
    EXTRACT(hour FROM t.created_at) as creation_hour,
    EXTRACT(dow FROM t.created_at) as creation_day_of_week,
    CASE
        WHEN t.completed_at IS NOT NULL THEN
            EXTRACT(epoch FROM (t.completed_at - t.created_at)) / 60
        ELSE NULL
    END as completion_time_minutes
FROM tasks t;

-- View for collaboration metrics
CREATE VIEW collaboration_metrics AS
SELECT
    d.id as decision_id,
    d.category,
    d.status,
    d.created_at,
    d.approved_at,
    COUNT(di.id) as input_count,
    COUNT(DISTINCT di.user_id) as contributor_count,
    COUNT(DISTINCT u.role) as role_diversity,
    AVG(di.agreement_level) as avg_agreement,
    EXTRACT(epoch FROM (d.approved_at - d.created_at)) / 3600 as decision_time_hours
FROM decisions d
LEFT JOIN decision_inputs di ON d.id = di.decision_id
LEFT JOIN users u ON di.user_id = u.id
GROUP BY d.id, d.category, d.status, d.created_at, d.approved_at;

-- Performance optimization: Partial indexes for common queries
CREATE INDEX idx_tasks_active ON tasks(user_id, created_at)
    WHERE status IN ('not_started', 'in_progress', 'stuck');

CREATE INDEX idx_decisions_active ON decisions(category, created_at)
    WHERE status IN ('proposed', 'under_discussion');

-- Row-level security (RLS) for multi-tenant data isolation
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_inputs ENABLE ROW LEVEL SECURITY;

-- RLS policies (example - would be expanded based on auth requirements)
CREATE POLICY user_tasks_policy ON tasks
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
```
