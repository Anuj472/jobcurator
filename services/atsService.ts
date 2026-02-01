import { AtsPlatform, Job } from '../types';
import { LocationService } from './locationService';

export class AtsService {
  private static PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/'
  ];

  /**
   * Enhanced fetch with real browser headers to avoid bot blocking
   */
  static async safeFetch(url: string, proxyIndex = -1): Promise<any> {
    // Try direct fetch first with browser-like headers
    if (proxyIndex === -1) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.google.com/',
            'Origin': 'https://www.google.com',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
          }
        });
        
        if (res.ok) {
          const text = await res.text();
          // Check if response is HTML (error page) instead of JSON
          if (text.trim().startsWith('<')) {
            console.warn(`   ⚠️ Received HTML instead of JSON from ${url}`);
            return this.safeFetch(url, 0);
          }
          return JSON.parse(text);
        }
      } catch (e: any) {
        console.warn(`   ⚠️ Direct fetch failed: ${e.message}`);
      }
      return this.safeFetch(url, 0);
    }
    
    // Try proxies
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
