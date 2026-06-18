import { AtsPlatform, Job } from '../types';
import { LocationService } from './locationService';

export class AtsService {
  // CORS proxies — only used in browser environments
  private static PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/'
  ];

  // Detect if running in Node.js (server-side) vs browser
  private static isServer = typeof process !== 'undefined' && process.versions?.node;

  /**
   * Fetch with retry logic for server-side, or proxy fallback for browser
   */
  static async safeFetch(url: string, proxyIndex = -1): Promise<any> {
    // Server-side (Node.js / GitHub Actions): call APIs directly, no proxies needed
    if (this.isServer) {
      return this.serverFetch(url);
    }

    // Browser: try direct first, then fall back to CORS proxies
    if (proxyIndex === -1) {
      try {
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        
        if (res.ok) {
          const text = await res.text();
          if (text.trim().startsWith('<')) {
            return this.safeFetch(url, 0);
          }
          return JSON.parse(text);
        }
      } catch (e: any) {
        console.warn(`   ⚠️ Direct fetch failed: ${e.message}`);
      }
      return this.safeFetch(url, 0);
    }
    
    // Try proxies (browser only)
    if (proxyIndex >= this.PROXIES.length) {
      console.error(`   ❌ All proxies failed for ${url}`);
      return null;
    }
    
    let fetchUrl = `${this.PROXIES[proxyIndex]}${encodeURIComponent(url)}`;
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Proxy Fail');
      const text = await response.text();
      
      if (this.PROXIES[proxyIndex].includes('allorigins.win')) {
        const wrapper = JSON.parse(text);
        return typeof wrapper.contents === 'string' ? JSON.parse(wrapper.contents) : wrapper.contents;
      }
      return JSON.parse(text);
    } catch (e) {
      return this.safeFetch(url, proxyIndex + 1);
    }
  }

  /**
   * Server-side direct fetch with retries (no CORS proxies needed)
   */
  private static async serverFetch(url: string, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'JobCurator/2.4 (GitHub Actions; +https://acrossjob.com)',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30s timeout
        });

        if (!res.ok) {
          if (res.status === 429) {
            // Rate limited — wait and retry
            const waitMs = attempt * 5000;
            console.warn(`   ⚠️ Rate limited on ${url}, waiting ${waitMs / 1000}s...`);
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (text.trim().startsWith('<')) {
          throw new Error('Received HTML instead of JSON');
        }
        return JSON.parse(text);
      } catch (e: any) {
        if (attempt < retries) {
          const waitMs = attempt * 2000;
          console.warn(`   ⚠️ Attempt ${attempt}/${retries} failed for ${url}: ${e.message}. Retrying in ${waitMs / 1000}s...`);
          await new Promise(r => setTimeout(r, waitMs));
        } else {
          console.error(`   ❌ All ${retries} attempts failed for ${url}: ${e.message}`);
          return null;
        }
      }
    }
    return null;
  }

  /**
   * FIXED: Greenhouse jobs fetcher with validation
   */
  static async fetchGreenhouseJobs(boardToken: string): Promise<any[]> {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
      const data = await this.safeFetch(url);
      
      if (!data) {
        console.warn(`   ⚠️ No data returned for Greenhouse board: ${boardToken}`);
        return [];
      }
      
      // Check for error responses
      if (data.error || data.message) {
        console.warn(`   ⚠️ Greenhouse API error for ${boardToken}: ${data.error || data.message}`);
        return [];
      }
      
      // Standard Greenhouse format
      if (Array.isArray(data.jobs)) {
        return data.jobs;
      }
      
      // Direct array (rare)
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn(`   ⚠️ Unexpected Greenhouse response format for ${boardToken}`);
      console.warn(`   Response keys: ${Object.keys(data).join(', ')}`);
      return [];
    } catch (error: any) {
      console.error(`   ❌ Greenhouse fetch error for ${boardToken}:`, error.message);
      return [];
    }
  }

  /**
   * FIXED: Lever jobs fetcher - returns PLAIN ARRAY
   */
  static async fetchLeverJobs(companyIdentifier: string): Promise<any[]> {
    try {
      const url = `https://api.lever.co/v0/postings/${companyIdentifier}?mode=json`;
      const data = await this.safeFetch(url);
      
      if (!data) {
        console.warn(`   ⚠️ No data returned for Lever: ${companyIdentifier}`);
        return [];
      }
      
      // Check for error responses
      if (data.error || data.message) {
        console.warn(`   ⚠️ Lever API error for ${companyIdentifier}: ${data.error || data.message}`);
        return [];
      }
      
      // CRITICAL: Lever returns PLAIN ARRAY
      if (Array.isArray(data)) {
        return data;
      }
      
      // Edge case: Wrapped in postings property
      if (data.postings && Array.isArray(data.postings)) {
        return data.postings;
      }
      
      console.warn(`   ⚠️ Unexpected Lever response format for ${companyIdentifier}`);
      console.warn(`   Response type: ${typeof data}, keys: ${Object.keys(data).join(', ')}`);
      return [];
    } catch (error: any) {
      console.error(`   ❌ Lever fetch error for ${companyIdentifier}:`, error.message);
      return [];
    }
  }

  /**
   * FIXED: Ashby jobs fetcher with correct endpoint
   */
  static async fetchAshbyJobs(boardToken: string): Promise<any[]> {
    try {
      // CORRECT ENDPOINT
      const url = `https://api.ashbyhq.com/posting-api/job-board/${boardToken}`;
      const data = await this.safeFetch(url);
      
      if (!data) {
        console.warn(`   ⚠️ No data returned for Ashby: ${boardToken}`);
        return [];
      }
      
      // Check for error responses
      if (data.error || data.message) {
        console.warn(`   ⚠️ Ashby API error for ${boardToken}: ${data.error || data.message}`);
        return [];
      }
      
      // Standard format
      if (Array.isArray(data.jobs)) {
        return data.jobs;
      }
      
      // Alternative format
      if (Array.isArray(data.jobPostings)) {
        return data.jobPostings;
      }
      
      console.warn(`   ⚠️ Unexpected Ashby response format for ${boardToken}`);
      console.warn(`   Response keys: ${Object.keys(data).join(', ')}`);
      return [];
    } catch (error: any) {
      console.error(`   ❌ Ashby fetch error for ${boardToken}:`, error.message);
      return [];
    }
  }

  /**
   * IMPROVED: Greenhouse normalizer
   */
  static normalizeGreenhouse(job: any, companyId: string): Partial<Job> {
    const locationStr = job.location?.name || 'Remote';
    const parsedLocation = LocationService.parseLocation(locationStr);
    
    let department = 'Engineering';
    if (job.departments && job.departments.length > 0) {
      department = job.departments[0].name;
    } else if (job.department) {
      department = job.department;
    }
    
    let jobType = 'full_time';
    if (job.metadata) {
      const employmentType = job.metadata.find((m: any) => 
        m.name === 'Employment Type' || m.name === 'Job Type'
      );
      if (employmentType?.value) {
        jobType = employmentType.value;
      }
    }
    
    return {
      company_id: companyId,
      title: job.title,
      location_city: parsedLocation.city,
      location_country: parsedLocation.country,
      category: department,
      apply_link: job.absolute_url,
      description: job.content || '',
      job_type: jobType,
      is_active: true
    };
  }

  /**
   * IMPROVED: Lever normalizer
   */
  static normalizeLever(job: any, companyId: string): Partial<Job> {
    const locationStr = job.categories?.location || job.location || 'Remote';
    const parsedLocation = LocationService.parseLocation(locationStr);
    
    let category = 'Engineering';
    if (job.categories?.team) {
      category = job.categories.team;
    } else if (job.team) {
      category = job.team;
    } else if (job.department) {
      category = job.department;
    }
    
    let jobType = 'full_time';
    if (job.categories?.commitment) {
      jobType = job.categories.commitment;
    } else if (job.commitment) {
      jobType = job.commitment;
    }
    
    return {
      company_id: companyId,
      title: job.text,
      location_city: parsedLocation.city,
      location_country: parsedLocation.country,
      category: category,
      apply_link: job.hostedUrl || job.applyUrl,
      description: job.description || job.descriptionPlain || '',
      job_type: jobType,
      is_active: true
    };
  }

  /**
   * IMPROVED: Ashby normalizer
   */
  static normalizeAshby(job: any, companyId: string): Partial<Job> {
    const locationStr = job.location || job.locationName || job.address || 'Remote';
    const parsedLocation = LocationService.parseLocation(locationStr);
    
    let department = 'Engineering';
    if (job.department) {
      department = job.department;
    } else if (job.departmentName) {
      department = job.departmentName;
    } else if (job.team) {
      department = job.team;
    }
    
    let jobType = 'full_time';
    if (job.employmentType) {
      jobType = job.employmentType;
    } else if (job.jobType) {
      jobType = job.jobType;
    }
    
    let applyLink = job.jobUrl || job.applyUrl || job.url || '';
    
    return {
      company_id: companyId,
      title: job.title,
      location_city: parsedLocation.city,
      location_country: parsedLocation.country,
      category: department,
      apply_link: applyLink,
      description: job.descriptionHtml || job.description || job.descriptionPlain || '',
      job_type: jobType,
      is_active: true
    };
  }

  static generateSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
}
