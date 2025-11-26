-- Migration: 005_bootstrap_audit_log.sql
-- Description: Create bootstrap kit audit log table for tracking kit generation, downloads, and verification
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Bootstrap Kit Audit Log Table
-- Tracks all bootstrap kit lifecycle events
CREATE TABLE IF NOT EXISTS public.bootstrap_kit_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('KIT_GENERATED', 'KIT_DOWNLOADED', 'VERIFY_SUCCESS', 'VERIFY_FAILED')),
    fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_bootstrap_audit_tenant_id ON public.bootstrap_kit_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bootstrap_audit_timestamp ON public.bootstrap_kit_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bootstrap_audit_action ON public.bootstrap_kit_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_bootstrap_audit_fingerprint ON public.bootstrap_kit_audit_log(fingerprint);

-- Comments for documentation
COMMENT ON TABLE public.bootstrap_kit_audit_log IS 'Audit log for bootstrap kit lifecycle events: generation, downloads, and verification';
COMMENT ON COLUMN public.bootstrap_kit_audit_log.action IS 'Action type: KIT_GENERATED, KIT_DOWNLOADED, VERIFY_SUCCESS, VERIFY_FAILED';
COMMENT ON COLUMN public.bootstrap_kit_audit_log.fingerprint IS 'SHA256 fingerprint of the bootstrap kit (for KIT_GENERATED and verification events)';
COMMENT ON COLUMN public.bootstrap_kit_audit_log.ip_address IS 'IP address of the client performing the action';
COMMENT ON COLUMN public.bootstrap_kit_audit_log.user_agent IS 'User agent string from the client request';


