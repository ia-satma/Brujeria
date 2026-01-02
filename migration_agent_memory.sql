-- migration_agent_memory.sql
-- Relational mapping for pCloud JSON to Neon Postgres

-- 1. Create agent_memory table
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Mandatory tenant isolation field
    legacy_pcloud_id VARCHAR(255), -- ID reference from the original pCloud file
    toon_metadata JSONB DEFAULT '{}', -- Optimized metadata using TOON vocabulary
    content JSONB NOT NULL, -- Original JSON payload
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_agent_memory_tenant ON agent_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_legacy_id ON agent_memory(legacy_pcloud_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_toon ON agent_memory USING GIN (toon_metadata);

-- 3. Trigger for updated_at (Postgres convention)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_memory_modtime
    BEFORE UPDATE ON agent_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
