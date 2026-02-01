export enum AtsPlatform {
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  ASHBY = 'ashby'
}

export type JobCategory = 'management' | 'it' | 'research-development' | 'sales' | 'marketing' | 'finance' | 'legal';
export type JobType = 'Remote' | 'On-site' | 'Hybrid';
// FIXED: Changed to kebab-case to match database constraint
export type ExperienceLevel = 'internship' | 'entry-level' | 'mid-level' | 'senior-level' | 'lead' | 'executive' | null;

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Metadata for the UI/Scraper
  ats_platform?: AtsPlatform;
  ats_identifier?: string;
  // Enhanced tracking fields
  auto_created?: boolean;  // Track if created automatically
  verified?: boolean;  // Manual verification flag
  active?: boolean;
  last_sync_at?: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  category: JobCategory;
  location_city?: string;
  location_country?: string;
  salary_range?: string;
  job_type: JobType;
  experience_level?: ExperienceLevel;  // Added for filtering by experience
  apply_link: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  company?: Company;
}

export interface SyncStats {
  found: number;
  added: number;
  updated: number;
  failed: number;
}
