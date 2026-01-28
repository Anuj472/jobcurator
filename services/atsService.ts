
import { AtsPlatform, Job } from '../types';

export class AtsService {
  private static PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://thingproxy.freeboard.io/fetch/'
  ];

  static async safeFetch(url: string, proxyIndex = -1): Promise<any> {
    // Try primary direct fetch first (works for raw.githubusercontent)
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

  static async fetchGreenhouseJobs(boardToken: string): Promise<any[]> {
    const data = await this.safeFetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`);
    return data?.jobs || [];
  }

  static async fetchLeverJobs(companyIdentifier: string): Promise<any[]> {
    const data = await this.safeFetch(`https://api.lever.co/v0/postings/${companyIdentifier}?mode=json`);
    return Array.isArray(data) ? data : [];
  }

  static async fetchAshbyJobs(boardToken: string): Promise<any[]> {
    const data = await this.safeFetch(`https://api.ashbyhq.com/v2/job-board/${boardToken}/list`);
    return data?.jobs || [];
  }

  static normalizeGreenhouse(job: any, companyId: string): Partial<Job> {
    return {
      company_id: companyId,
      external_id: job.id?.toString(),
      title: job.title,
      location_city: job.location?.name?.split(',')[0]?.trim() || 'Remote',
      category: job.departments?.[0]?.name || 'Engineering',
      apply_link: job.absolute_url,
      description: job.content || '',
      job_type: job.metadata?.find((m: any) => m.name === 'Employment Type')?.value || 'Full Time',
      is_active: true
    };
  }

  static normalizeLever(job: any, companyId: string): Partial<Job> {
    return {
      company_id: companyId,
      external_id: job.id,
      title: job.text,
      location_city: job.categories?.location || 'Remote',
      category: job.categories?.team || 'Engineering',
      apply_link: job.hostedUrl || job.applyUrl,
      description: job.description || '',
      job_type: job.categories?.commitment || 'Full Time',
      is_active: true
    };
  }

  static normalizeAshby(job: any, companyId: string): Partial<Job> {
    return {
      company_id: companyId,
      external_id: job.id,
      title: job.title,
      location_city: job.location || 'Remote',
      category: job.department || 'Engineering',
      apply_link: job.jobUrl,
      description: job.descriptionHtml || job.description || '',
      job_type: job.employmentType || 'Full Time',
      is_active: true
    };
  }

  static generateSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
}
