-- Migration: 001_init.sql
-- Description: Initialize onboarding database schema
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Operator Keys Table
-- Stores WebAuthn credentials for operator authentication
CREATE TABLE IF NOT EXISTS public.operator_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    session_data JSONB,
    credential_data JSONB,
    device_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operator_keys_user_id ON public.operator_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_operator_keys_created_at ON public.operator_keys(created_at);

-- Capability Tokens Table
-- Stores issued Operator Capability Tokens (OCT) with scopes and expiration
CREATE TABLE IF NOT EXISTS public.capability_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_capability_tokens_token_id ON public.capability_tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_capability_tokens_user_id ON public.capability_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_capability_tokens_expires_at ON public.capability_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_capability_tokens_revoked_at ON public.capability_tokens(revoked_at);

-- Tenants Table
-- Stores tenant configuration and onboarding data
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    region VARCHAR(100),
    config_data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_name ON public.tenants(name);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON public.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants(created_at);

-- Tenant Policies Table
-- Stores access policies and configuration for tenants
CREATE TABLE IF NOT EXISTS public.tenant_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    policy_type VARCHAR(100) NOT NULL,
    policy_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_policies_tenant_id ON public.tenant_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_policies_policy_type ON public.tenant_policies(policy_type);

-- Audit Log Table
-- Stores all security and administrative events for compliance
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON public.audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_operator_keys_updated_at
    BEFORE UPDATE ON public.operator_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_policies_updated_at
    BEFORE UPDATE ON public.tenant_policies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure search_path is set correctly
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO postgres;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO postgres;

