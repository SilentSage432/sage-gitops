-- Migration: 004_bootstrap_kits.sql
-- Description: Add bootstrap_kits table for storing generated bootstrap kits
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Bootstrap Kits Table
-- Stores generated bootstrap kits with fingerprints and activation status
CREATE TABLE IF NOT EXISTS public.bootstrap_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    fingerprint TEXT NOT NULL UNIQUE,
    kit_data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_bootstrap_kits_tenant_id ON public.bootstrap_kits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bootstrap_kits_fingerprint ON public.bootstrap_kits(fingerprint);
CREATE INDEX IF NOT EXISTS idx_bootstrap_kits_activated_at ON public.bootstrap_kits(activated_at);
CREATE INDEX IF NOT EXISTS idx_bootstrap_kits_expires_at ON public.bootstrap_kits(expires_at);

