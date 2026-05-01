-- Create prospects table
CREATE TABLE IF NOT EXISTS prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    prospect_data JSONB NOT NULL,
    enrichment_data JSONB,
    opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
    enrichment_confidence DECIMAL(3,2) CHECK (enrichment_confidence >= 0 AND enrichment_confidence <= 1),
    status VARCHAR(50) DEFAULT 'pending',
    source VARCHAR(100),
    upload_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_prospects_agent_id ON prospects(agent_id);
CREATE INDEX idx_prospects_assigned_agent_id ON prospects(assigned_agent_id);
CREATE INDEX idx_prospects_opportunity_score ON prospects(opportunity_score DESC);
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_created_at ON prospects(created_at DESC);

-- Create GIN indexes for JSONB queries
CREATE INDEX idx_prospects_prospect_data ON prospects USING GIN (prospect_data);
CREATE INDEX idx_prospects_enrichment_data ON prospects USING GIN (enrichment_data);

-- Create lead enrichment log table
CREATE TABLE IF NOT EXISTS lead_enrichment_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    enrichment_source VARCHAR(100) NOT NULL,
    data_fetched JSONB NOT NULL,
    confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'success'
);

-- Create indexes
CREATE INDEX idx_enrichment_log_prospect_id ON lead_enrichment_log(prospect_id);
CREATE INDEX idx_enrichment_log_source ON lead_enrichment_log(enrichment_source);

-- Create lead triggers table
CREATE TABLE IF NOT EXISTS lead_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    trigger_type VARCHAR(100) NOT NULL,
    action_taken JSONB NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed'
);

-- Create indexes
CREATE INDEX idx_lead_triggers_prospect_id ON lead_triggers(prospect_id);
CREATE INDEX idx_lead_triggers_trigger_type ON lead_triggers(trigger_type);
CREATE INDEX idx_lead_triggers_executed_at ON lead_triggers(executed_at DESC);

-- Create uploads tracking table
CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID REFERENCES agents(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    s3_key VARCHAR(255),
    status VARCHAR(50) DEFAULT 'processing',
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_uploads_uploaded_by ON uploads(uploaded_by);
CREATE INDEX idx_uploads_status ON uploads(status);
CREATE INDEX idx_uploads_created_at ON uploads(created_at DESC);
