import { AtsPlatform, Job } from '../types';
import { LocationService } from './locationService';

export class AtsService {
  private static PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/'
  ];

  static async safeFetch(url: string, proxyIndex = -1): Promise<any> {
    if (proxyIndex === -1) {
        try {
            const res = await fetch(url);
            if (res.ok) return await res.json();
        } catch (e) {}
        return this.safeFetch(url, 0);
    }
    if (proxyIndex >= this.PROXIES.length) return null;
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
   * FIXED: Greenhouse jobs fetcher
   * Handles both standard Greenhouse API and edge cases
   */
  static async fetchGreenhouseJobs(boardToken: string): Promise<any[]> {
    try {
      const data = await this.safeFetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`);
      
      // CRITICAL: Greenhouse returns { jobs: [...] }
      if (!data) {
        console.warn(`   ⚠️ No data returned for ${boardToken}`);
        return [];
      }
      
      if (Array.isArray(data.jobs)) {
        return data.jobs;
      }
      
      // Some boards might return jobs directly as array (rare)
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn(`   ⚠️ Unexpected Greenhouse response format for ${boardToken}`);
      return [];
    } catch (error: any) {
      console.error(`   ❌ Greenhouse fetch error for ${boardToken}:`, error.message);
      return [];
    }
  }

  /**
   * FIXED: Lever jobs fetcher
   * Critical fix: Lever returns a PLAIN ARRAY, NOT { jobs: [...] }
   */
  static async fetchLeverJobs(companyIdentifier: string): Promise<any[]> {
    try {
      const data = await this.safeFetch(`https://api.lever.co/v0/postings/${companyIdentifier}?mode=json`);
      
      // CRITICAL: Lever returns PLAIN ARRAY [...], not wrapped object
      if (!data) {
        console.warn(`   ⚠️ No data returned for ${companyIdentifier}`);
        return [];
      }
      
      if (Array.isArray(data)) {
        return data;
      }
      
      // Edge case: Some Lever boards might wrap it
      if (data.postings && Array.isArray(data.postings)) {
        return data.postings;
      }
      
      console.warn(`   ⚠️ Unexpected Lever response format for ${companyIdentifier}`);
      console.warn(`   Response type: ${typeof data}, has jobs property: ${!!data.jobs}`);
      return [];
    } catch (error: any) {
      console.error(`   ❌ Lever fetch error for ${companyIdentifier}:`, error.message);
      return [];
    }
  }

  /**
   * FIXED: Ashby jobs fetcher
   * Updated with correct API endpoint
   */
  static async fetchAshbyJobs(boardToken: string): Promise<any[]> {
    try {
      // FIXED: Correct Ashby endpoint is /posting-api/job-board/ not /v2/job-board/
      const data = await this.safeFetch(`https://api.ashbyhq.com/posting-api/job-board/${boardToken}`);
      
      if (!data) {
        console.warn(`   ⚠️ No data returned for ${boardToken}`);
        return [];
      }
      
      // Ashby returns { jobs: [...] }
      if (Array.isArray(data.jobs)) {
        return data.jobs;
      }
      
      // Alternative format: { jobPostings: [...] }
      if (Array.isArray(data.jobPostings)) {
        return data.jobPostings;
      }
      
      console.warn(`   ⚠️ Unexpected Ashby response format for ${boardToken}`);
      return [];
    } catch (error: any) {
      console.error(`   ❌ Ashby fetch error for ${boardToken}:`, error.message);
      return [];
    }
  }

  /**
   * IMPROVED: Greenhouse normalizer with better field extraction
   */
  static normalizeGreenhouse(job: any, companyId: string): Partial<Job> {
    // Parse location using LocationService
    const locationStr = job.location?.name || 'Remote';
    const parsedLocation = LocationService.parseLocation(locationStr);
    
    // Better department extraction
    let department = 'Engineering';
    if (job.departments && job.departments.length > 0) {
      department = job.departments[0].name;
    } else if (job.department) {
      department = job.department;
    }
    
    // Better job type extraction
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
   * IMPROVED: Lever normalizer with better field handling
   */
  static normalizeLever(job: any, companyId: string): Partial<Job> {
    // Parse location using LocationService
    const locationStr = job.categories?.location || job.location || 'Remote';
    const parsedLocation = LocationService.parseLocation(locationStr);
    
    // Better category/team extraction
    let category = 'Engineering';
    if (job.categories?.team) {
      category = job.categories.team;
    } else if (job.team) {
      category = job.team;
    } else if (job.department) {
      category = job.department;
    }
    
    // Better job type extraction
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
   * IMPROVED: Ashby normalizer with better field handling
   */
  static normalizeAshby(job: any, companyId: string): Partial<Job> {
    // Parse location using LocationService
    const locationStr = job.location || job.locationName || job.address || 'Remote';
    const parsedLocation = LocationService.parseLocation(locationStr);
    
    // Better department extraction
    let department = 'Engineering';
    if (job.department) {
      department = job.department;
    } else if (job.departmentName) {
      department = job.departmentName;
    } else if (job.team) {
      department = job.team;
    }
    
    // Better job type extraction
    let jobType = 'full_time';
    if (job.employmentType) {
      jobType = job.employmentType;
    } else if (job.jobType) {
      jobType = job.jobType;
    }
    
    // Better apply link extraction
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
