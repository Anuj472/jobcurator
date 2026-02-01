/**
 * Workday RSS Feed Service
 * 
 * Many enterprise companies (Uber, Salesforce, Snowflake, etc.) use Workday ATS
 * which provides public RSS feeds for job listings.
 * 
 * RSS Feed URL Pattern:
 * https://[company].wd[1-12].myworkdayjobs.com/[site_id]/rss
 */

import { Job } from '../types';
import { LocationService } from './locationService';

interface WorkdayConfig {
  companyName: string;
  workdayDomain: string; // e.g., "uber.wd1.myworkdayjobs.com"
  siteId: string; // e.g., "Uber_Careers"
}

export class WorkdayService {
  /**
   * Fetch jobs from Workday RSS feed
   */
  static async fetchWorkdayJobs(config: WorkdayConfig): Promise<any[]> {
    const rssUrl = `https://${config.workdayDomain}/${config.siteId}/rss`;
    
    try {
      console.log(`   📡 Fetching Workday RSS: ${rssUrl}`);
      
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      if (!response.ok) {
        console.warn(`   ⚠️ RSS fetch failed: HTTP ${response.status}`);
        return [];
      }

      const xmlText = await response.text();
      
      // Parse XML to extract jobs
      const jobs = this.parseWorkdayRSS(xmlText, config.companyName);
      return jobs;
      
    } catch (error: any) {
      console.error(`   ❌ Workday RSS error for ${config.companyName}:`, error.message);
      return [];
    }
  }

  /**
   * Parse Workday RSS XML to extract job data
   */
  private static parseWorkdayRSS(xmlText: string, companyName: string): any[] {
    const jobs: any[] = [];
    
    try {
      // Extract all <item> blocks using regex
      const itemRegex = /<item>(.*?)<\/item>/gs;
      const items = xmlText.match(itemRegex);
      
      if (!items || items.length === 0) {
        console.warn(`   ⚠️ No job items found in RSS feed`);
        return [];
      }

      for (const item of items) {
        try {
          const job = this.parseRSSItem(item, companyName);
          if (job) jobs.push(job);
        } catch (err) {
          // Skip malformed items
          continue;
        }
      }

      return jobs;
    } catch (error: any) {
      console.error(`   ❌ RSS parsing error:`, error.message);
      return [];
    }
  }

  /**
   * Parse a single RSS <item> to extract job details
   */
  private static parseRSSItem(itemXml: string, companyName: string): any | null {
    try {
      // Extract fields using regex
      const title = this.extractXMLTag(itemXml, 'title');
      const link = this.extractXMLTag(itemXml, 'link');
      const description = this.extractXMLTag(itemXml, 'description');
      const pubDate = this.extractXMLTag(itemXml, 'pubDate');
      
      // Workday often includes location in title like "Software Engineer - San Francisco, CA"
      const location = this.extractLocation(title || '', description || '');
      
      if (!title || !link) {
        return null;
      }

      return {
        title: this.cleanText(title),
        link: this.cleanText(link),
        description: this.cleanText(description || ''),
        location: location,
        pubDate: pubDate,
        companyName: companyName
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract content from XML tag
   */
  private static extractXMLTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}(?:[^>]*)><!\[CDATA\[(.*?)\]\]><\/${tagName}>`, 's');
    const cdataMatch = xml.match(regex);
    if (cdataMatch) return cdataMatch[1];
    
    const simpleRegex = new RegExp(`<${tagName}(?:[^>]*)>(.*?)<\/${tagName}>`, 's');
    const simpleMatch = xml.match(simpleRegex);
    if (simpleMatch) return simpleMatch[1];
    
    return null;
  }

  /**
   * Extract location from title or description
   */
  private static extractLocation(title: string, description: string): string {
    const combined = `${title} ${description}`;
    
    // Common patterns: "- Location, ST" or "(Location, ST)" or "in Location, ST"
    const locationPatterns = [
      /[-–—]\s*([A-Za-z\s]+,\s*[A-Z]{2})/,  // Dash separator
      /\(([A-Za-z\s]+,\s*[A-Z]{2})\)/,      // Parentheses
      /\bin\s+([A-Za-z\s]+,\s*[A-Z]{2})/,   // "in" keyword
      /Location[:\s]+([A-Za-z\s]+,\s*[A-Z]{2})/ // Explicit "Location:"
    ];
    
    for (const pattern of locationPatterns) {
      const match = combined.match(pattern);
      if (match) return match[1].trim();
    }
    
    // Check for "Remote" keyword
    if (/\bremote\b/i.test(combined)) {
      return 'Remote';
    }
    
    return 'Not Specified';
  }

  /**
   * Clean HTML entities and extra whitespace
   */
  private static cleanText(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Normalize Workday job to standard Job format
   */
  static normalizeWorkday(job: any, companyId: string): Partial<Job> {
    const parsedLocation = LocationService.parseLocation(job.location);
    
    // Extract department/category from title or description
    const category = this.extractCategory(job.title, job.description);
    
    return {
      company_id: companyId,
      title: job.title,
      location_city: parsedLocation.city,
      location_country: parsedLocation.country,
      category: category,
      apply_link: job.link,
      description: job.description,
      job_type: 'full_time',
      is_active: true
    };
  }

  /**
   * Extract category from job title/description
   */
  private static extractCategory(title: string, description: string): string {
    const combined = `${title} ${description}`.toLowerCase();
    
    const categoryMap: Record<string, string[]> = {
      'it': ['engineer', 'developer', 'software', 'architect', 'devops', 'sre', 'technical'],
      'sales': ['sales', 'account executive', 'business development', 'account manager'],
      'marketing': ['marketing', 'brand', 'growth', 'content', 'social media'],
      'finance': ['finance', 'accounting', 'financial', 'analyst'],
      'legal': ['legal', 'counsel', 'attorney', 'compliance'],
      'management': ['director', 'manager', 'head of', 'vp', 'chief', 'executive'],
      'research-development': ['research', 'scientist', 'r&d', 'phd']
    };
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => combined.includes(kw))) {
        return category;
      }
    }
    
    return 'it'; // Default
  }

  /**
   * Generate Workday RSS URL from company info
   */
  static buildRSSUrl(workdayDomain: string, siteId: string): string {
    return `https://${workdayDomain}/${siteId}/rss`;
  }
}

/**
 * Known Workday Companies Configuration
 */
export const WORKDAY_COMPANIES: WorkdayConfig[] = [
  {
    companyName: 'Uber',
    workdayDomain: 'uber.wd1.myworkdayjobs.com',
    siteId: 'Uber_Careers'
  },
  {
    companyName: 'Salesforce',
    workdayDomain: 'salesforce.wd1.myworkdayjobs.com',
    siteId: 'External_Career_Site'
  },
  {
    companyName: 'Snowflake',
    workdayDomain: 'snowflake.wd5.myworkdayjobs.com',
    siteId: 'Snowflake_Careers'
  },
  {
    companyName: 'Amazon',
    workdayDomain: 'amazon.jobs',
    siteId: 'en/rss' // Amazon uses custom structure
  },
  // Add more as discovered
];
