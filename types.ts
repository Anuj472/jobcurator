
export enum AtsPlatform {
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  ASHBY = 'ashby'
}

export type JobCategory = 'management' | 'it' | 'research-development';
export type JobType = 'Remote' | 'On-site' | 'Hybrid';

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
  // Fix: Adding properties used in SyncManager and database schema
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
