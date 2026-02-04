-- Migration: Add linkedin_posted_at column to jobs table
-- Purpose: Track when jobs are posted to LinkedIn to prevent duplicates
-- Date: 2026-02-04

-- Add the column
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS linkedin_posted_at TIMESTAMP WITH TIME ZONE;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_linkedin_posted_at 
ON jobs(linkedin_posted_at);

-- Create a composite index for the common query pattern
CREATE INDEX IF NOT EXISTS idx_jobs_status_linkedin_posted 
ON jobs(status, linkedin_posted_at) 
WHERE status = 'active';

-- Add a comment to the column
COMMENT ON COLUMN jobs.linkedin_posted_at IS 'Timestamp of when this job was last posted to LinkedIn';