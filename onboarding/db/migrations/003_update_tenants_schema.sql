-- Migration: 003_update_tenants_schema.sql
-- Description: Add email column to tenants table for better queryability
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Add email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN email VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);
    END IF;
END $$;

