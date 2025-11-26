-- Migration: 007_identity_config.sql
-- Description: Add identity configuration columns to tenants table
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Add identity configuration columns to tenants table
DO $$
BEGIN
    -- Add identity_provider column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'identity_provider'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN identity_provider VARCHAR(100);
    END IF;

    -- Add identity_config JSONB column for storing full identity configuration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'identity_config'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN identity_config JSONB;
    END IF;

    -- Add identity_validated_at timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'identity_validated_at'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN identity_validated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index on identity_provider for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_identity_provider ON public.tenants(identity_provider);

-- Create index on identity_config for JSONB queries
CREATE INDEX IF NOT EXISTS idx_tenants_identity_config ON public.tenants USING GIN (identity_config);

