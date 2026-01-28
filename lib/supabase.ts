
import { createClient } from '@supabase/supabase-js';

// Project ID: pfjzheljgnhuxzjbqkpm
const supabaseUrl = 'https://pfjzheljgnhuxzjbqkpm.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_xiIKs63wugMipzKUh_rK3A_dv847JJ3'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🚨 CRITICAL DATABASE FIX 🚨
 * 
 * Your "jobs" table needs a UNIQUE constraint for the "apply_link" column 
 * so that we can prevent duplicates when syncing.
 * 
 * RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:
 * 
 * ALTER TABLE public.jobs ADD CONSTRAINT jobs_apply_link_unique UNIQUE (apply_link);
 */
