-- Migration: 002_tenant_agents.sql
-- Description: Add agents registry and tenant_agents junction table
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Agents Registry Table
-- Stores available agents that can be assigned to tenants
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    requirements JSONB,
    capabilities JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_id ON public.agents(id);
CREATE INDEX IF NOT EXISTS idx_agents_name ON public.agents(name);

-- Tenant Agents Junction Table
-- Links tenants to their selected agents
CREATE TABLE IF NOT EXISTS public.tenant_agents (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_agents_tenant_id ON public.tenant_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_agents_agent_id ON public.tenant_agents(agent_id);

-- Trigger to update agents.updated_at
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial agents (matching frontend hardcoded list)
INSERT INTO public.agents (id, name, description, created_at, updated_at) VALUES
    ('researcher', 'Researcher Agent', 'Data gathering + external retrieval', NOW(), NOW()),
    ('audit-logger', 'Audit Logger', 'Immutable compliance logging', NOW(), NOW()),
    ('etl-lite', 'ETL-Lite', 'Basic data processing and ingestion', NOW(), NOW()),
    ('notification-relay', 'Notification Relay', 'Alerts + async messaging', NOW(), NOW()),
    ('observer', 'Observer Agent', 'Passive telemetry + drift detection', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

