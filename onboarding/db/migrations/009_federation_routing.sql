-- Migration: 009_federation_routing.sql
-- Description: Add federation routing infrastructure for multi-database support
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Federation Nodes Table
-- Stores information about federation nodes (databases/regions)
CREATE TABLE IF NOT EXISTS public.federation_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id VARCHAR(255) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL,
    database_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    priority INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_federation_nodes_node_id ON public.federation_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_federation_nodes_region ON public.federation_nodes(region);
CREATE INDEX IF NOT EXISTS idx_federation_nodes_status ON public.federation_nodes(status);
CREATE INDEX IF NOT EXISTS idx_federation_nodes_priority ON public.federation_nodes(priority);

-- Federation Routing Table
-- Stores routing rules for tenant/region to database mapping
CREATE TABLE IF NOT EXISTS public.federation_routing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    region VARCHAR(100) NOT NULL,
    node_id VARCHAR(255) NOT NULL REFERENCES public.federation_nodes(node_id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    weight INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, region, node_id)
);

CREATE INDEX IF NOT EXISTS idx_federation_routing_tenant_id ON public.federation_routing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_federation_routing_region ON public.federation_routing(region);
CREATE INDEX IF NOT EXISTS idx_federation_routing_node_id ON public.federation_routing(node_id);
CREATE INDEX IF NOT EXISTS idx_federation_routing_primary ON public.federation_routing(tenant_id, is_primary) WHERE is_primary = true;

-- Tenant Federation Map Table
-- Stores tenant-to-federation-node mappings with metadata
CREATE TABLE IF NOT EXISTS public.tenant_federation_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    primary_node_id VARCHAR(255) NOT NULL REFERENCES public.federation_nodes(node_id) ON DELETE RESTRICT,
    primary_region VARCHAR(100) NOT NULL,
    federation_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_federation_map_tenant_id ON public.tenant_federation_map(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_federation_map_primary_node ON public.tenant_federation_map(primary_node_id);
CREATE INDEX IF NOT EXISTS idx_tenant_federation_map_primary_region ON public.tenant_federation_map(primary_region);

-- Trigger to update updated_at
CREATE TRIGGER update_federation_nodes_updated_at
    BEFORE UPDATE ON public.federation_nodes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_federation_routing_updated_at
    BEFORE UPDATE ON public.federation_routing
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_federation_map_updated_at
    BEFORE UPDATE ON public.tenant_federation_map
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default federation node (current database)
-- This allows backward compatibility - existing tenants route to default node
INSERT INTO public.federation_nodes (node_id, region, database_url, status, priority, metadata)
VALUES (
    'default',
    'us-east',
    COALESCE(current_setting('app.database_url', true), 'postgres://silentsage@localhost:5432/sage_os?search_path=public'),
    'active',
    0,
    '{"description": "Default federation node for backward compatibility"}'::jsonb
) ON CONFLICT (node_id) DO NOTHING;

