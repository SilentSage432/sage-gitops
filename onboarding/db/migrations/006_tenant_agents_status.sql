-- Migration: 006_tenant_agents_status.sql
-- Description: Add status column to tenant_agents table for tracking deployment status
-- Database: sage_os
-- Schema: public

SET search_path TO public;

-- Add status column to tenant_agents table
ALTER TABLE public.tenant_agents
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deployed', 'failed'));

-- Create index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_tenant_agents_status ON public.tenant_agents(status);

-- Update existing records to have 'pending' status if NULL
UPDATE public.tenant_agents
SET status = 'pending'
WHERE status IS NULL;

-- Comments for documentation
COMMENT ON COLUMN public.tenant_agents.status IS 'Agent deployment status: pending, deployed, or failed';


