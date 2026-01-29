/**
 * Location Service
 * Maps cities to their correct countries and parses location strings
 */

export interface ParsedLocation {
  city: string;
  country: string;
  state?: string;
  isRemote: boolean;
}

export class LocationService {
  // Major Indian cities
  private static readonly INDIAN_CITIES = new Set([
    'bangalore', 'bengaluru', 'mumbai', 'delhi', 'gurgaon', 'gurugram', 'hyderabad',
    'chennai', 'pune', 'kolkata', 'ahmedabad', 'jaipur', 'surat', 'lucknow',
    'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri',
    'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad',
    'meerut', 'rajkot', 'kalyan', 'vasai', 'varanasi', 'srinagar', 'aurangabad',
    'dhanbad', 'amritsar', 'navi mumbai', 'allahabad', 'prayagraj', 'ranchi',
    'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur',
    'madurai', 'raipur', 'kota', 'chandigarh', 'guwahati', 'noida', 'greater noida'
  ]);

  // Major US cities
  private static readonly US_CITIES = new Set([
    'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
    'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
    'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis',
    'seattle', 'denver', 'washington', 'boston', 'nashville', 'detroit',
    'portland', 'las vegas', 'memphis', 'louisville', 'baltimore', 'milwaukee',
    'albuquerque', 'tucson', 'fresno', 'sacramento', 'kansas city', 'atlanta',
    'miami', 'oakland', 'raleigh', 'minneapolis', 'tulsa', 'cleveland',
    'new orleans', 'tampa', 'honolulu', 'colorado springs', 'st. louis'
  ]);

  // Major UK cities
  private static readonly UK_CITIES = new Set([
    'london', 'birmingham', 'manchester', 'glasgow', 'liverpool', 'edinburgh',
    'leeds', 'bristol', 'sheffield', 'cardiff', 'belfast', 'newcastle',
    'nottingham', 'southampton', 'leicester', 'coventry', 'bradford', 'stoke'
  ]);

  // Major Canadian cities
  private static readonly CANADIAN_CITIES = new Set([
    'toronto', 'montreal', 'vancouver', 'calgary', 'edmonton', 'ottawa',
    'winnipeg', 'quebec city', 'hamilton', 'kitchener', 'london', 'victoria'
  ]);

  // Major Australian cities
  private static readonly AUSTRALIAN_CITIES = new Set([
    'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'gold coast',
    'canberra', 'newcastle', 'wollongong', 'logan city', 'geelong', 'hobart'
  ]);

  // Major European cities
  private static readonly EUROPEAN_CITIES: Map<string, string> = new Map([
    ['paris', 'France'], ['berlin', 'Germany'], ['madrid', 'Spain'],
    ['rome', 'Italy'], ['amsterdam', 'Netherlands'], ['barcelona', 'Spain'],
    ['munich', 'Germany'], ['milan', 'Italy'], ['prague', 'Czech Republic'],
    ['vienna', 'Austria'], ['budapest', 'Hungary'], ['warsaw', 'Poland'],
    ['dublin', 'Ireland'], ['brussels', 'Belgium'], ['zurich', 'Switzerland'],
    ['stockholm', 'Sweden'], ['copenhagen', 'Denmark'], ['oslo', 'Norway'],
    ['helsinki', 'Finland'], ['athens', 'Greece'], ['lisbon', 'Portugal']
  ]);

  // Major Asian cities
  private static readonly ASIAN_CITIES: Map<string, string> = new Map([
    ['singapore', 'Singapore'], ['tokyo', 'Japan'], ['shanghai', 'China'],
    ['beijing', 'China'], ['hong kong', 'Hong Kong'], ['seoul', 'South Korea'],
    ['bangkok', 'Thailand'], ['kuala lumpur', 'Malaysia'], ['manila', 'Philippines'],
    ['jakarta', 'Indonesia'], ['dubai', 'United Arab Emirates'], ['tel aviv', 'Israel'],
    ['taipei', 'Taiwan'], ['ho chi minh', 'Vietnam'], ['hanoi', 'Vietnam']
  ]);

  /**
   * Parse location string from job posting
   * Handles formats like:
   * - "Bangalore, India"
   * - "San Francisco, CA"
   * - "London, UK"
   * - "Remote"
   * - "Bangalore"
   */
  static parseLocation(locationStr: string): ParsedLocation {
    if (!locationStr) {
      return { city: 'Remote', country: 'Global', isRemote: true };
    }

    const normalized = locationStr.toLowerCase().trim();

    // Check if remote
    if (normalized.includes('remote') || normalized.includes('anywhere') || normalized === 'wfh') {
      return { city: 'Remote', country: 'Global', isRemote: true };
    }

    // Split by comma to get parts
    const parts = locationStr.split(',').map(p => p.trim());
    
    if (parts.length === 0) {
      return { city: 'Remote', country: 'Global', isRemote: true };
    }

    const city = parts[0];
    const cityLower = city.toLowerCase();
    
    // If country is explicitly mentioned in second part
    if (parts.length >= 2) {
      const secondPart = parts[1].toLowerCase().trim();
      
      // Full country names
      if (secondPart === 'india' || secondPart === 'in') {
        return { city, country: 'India', state: parts[2], isRemote: false };
      }
      if (secondPart === 'usa' || secondPart === 'united states' || secondPart === 'us') {
        return { city, country: 'United States', state: parts[2], isRemote: false };
      }
      if (secondPart === 'uk' || secondPart === 'united kingdom' || secondPart === 'england') {
        return { city, country: 'United Kingdom', isRemote: false };
      }
      if (secondPart === 'canada' || secondPart === 'ca') {
        return { city, country: 'Canada', isRemote: false };
      }
      if (secondPart === 'australia' || secondPart === 'au') {
        return { city, country: 'Australia', isRemote: false };
      }
      
      // Check if it's a US state abbreviation
      const usStates = ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy'];
      if (usStates.includes(secondPart)) {
        return { city, country: 'United States', state: parts[1], isRemote: false };
      }
    }

    // Infer country from city name
    const country = this.inferCountryFromCity(cityLower);
    return { city, country, isRemote: false };
  }

  /**
   * Infer country based on city name
   */
  private static inferCountryFromCity(cityLower: string): string {
    // Check Indian cities
    if (this.INDIAN_CITIES.has(cityLower)) {
      return 'India';
    }
    
    // Bangalore alternative spelling
    if (cityLower.includes('bengaluru') || cityLower.includes('bangalore')) {
      return 'India';
    }

    // Check US cities
    if (this.US_CITIES.has(cityLower)) {
      return 'United States';
    }

    // Check UK cities
    if (this.UK_CITIES.has(cityLower)) {
      return 'United Kingdom';
    }

    // Check Canadian cities
    if (this.CANADIAN_CITIES.has(cityLower)) {
      return 'Canada';
    }

    // Check Australian cities
    if (this.AUSTRALIAN_CITIES.has(cityLower)) {
      return 'Australia';
    }

    // Check European cities
    if (this.EUROPEAN_CITIES.has(cityLower)) {
      return this.EUROPEAN_CITIES.get(cityLower)!;
    }

    // Check Asian cities
    if (this.ASIAN_CITIES.has(cityLower)) {
      return this.ASIAN_CITIES.get(cityLower)!;
    }

    // Default fallback
    return 'Global';
  }

  /**
   * Format location for display
   */
  static formatLocation(parsed: ParsedLocation): string {
    if (parsed.isRemote) {
      return 'Remote';
    }
    
    if (parsed.state) {
      return `${parsed.city}, ${parsed.state}, ${parsed.country}`;
    }
    
    return `${parsed.city}, ${parsed.country}`;
  }

  /**
   * Check if a location string indicates remote work
   */
  static isRemote(locationStr: string): boolean {
    if (!locationStr) return true;
    const normalized = locationStr.toLowerCase().trim();
    return normalized.includes('remote') || 
           normalized.includes('anywhere') || 
           normalized === 'wfh' ||
           normalized.includes('work from home');
  }
}
