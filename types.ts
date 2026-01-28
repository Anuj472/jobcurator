
export enum AtsPlatform {
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  ASHBY = 'ashby'
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  ats_platform: AtsPlatform; // Meta-field for fetching
  ats_identifier: string;    // Meta-field for fetching
  active: boolean;           // Added to support filtering and sync status
  last_sync_at?: string;     // Added to support sync tracking
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: string;
  company_id: string;
  external_id: string; // Crucial for deduplication (add this to your schema!)
  title: string;
  category?: string;
  location_city?: string;
  location_country?: string;
  salary_range?: string;
  job_type: string;
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
