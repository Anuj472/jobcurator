/**
 * Sitemap Generator for acrossjob.com
 * 
 * Generates a comprehensive sitemap.xml with all active job listings from Supabase.
 * This ensures Google can discover and index all job pages.
 * 
 * Run: npx tsx scripts/generateSitemap.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SITE_URL = 'https://acrossjob.com';

interface Job {
  id: string;
  title: string;
  company_id: string;
  location_city?: string;
  location_country?: string;
  category: string;
  updated_at?: string;
}

interface Company {
  id: string;
  slug: string;
  updated_at?: string;
}

/**
 * Generate slug from job title and company
 */
function generateJobSlug(job: Job, companySlug: string): string {
  const titleSlug = job.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  
  return `${companySlug}-${titleSlug}-${job.id.slice(0, 8)}`;
}

/**
 * Fetch all active jobs from database
 */
async function fetchAllJobs(): Promise<{ jobs: Job[]; companies: Map<string, Company> }> {
  console.log('📥 Fetching active jobs from Supabase...');
  
  // Fetch companies first
  const { data: companiesData, error: companiesError } = await supabase
    .from('companies')
    .select('id, slug, updated_at')
    .eq('active', true);
  
  if (companiesError) {
    console.error('❌ Error fetching companies:', companiesError);
    throw companiesError;
  }
  
  const companiesMap = new Map<string, Company>();
  companiesData?.forEach(company => {
    companiesMap.set(company.id, company);
  });
  
  console.log(`   ✅ Found ${companiesMap.size} active companies`);
  
  // Fetch all active jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, company_id, location_city, location_country, category, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false });
  
  if (jobsError) {
    console.error('❌ Error fetching jobs:', jobsError);
    throw jobsError;
  }
  
  console.log(`   ✅ Found ${jobs?.length || 0} active jobs`);
  
  return { jobs: jobs || [], companies: companiesMap };
}

/**
 * Generate sitemap XML
 */
function generateSitemapXML(jobs: Job[], companies: Map<string, Company>): string {
  const now = new Date().toISOString();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">

`;
  
  // 1. Homepage (highest priority)
  xml += `  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>

`;
  
  // 2. Main category pages
  const categories = ['it', 'sales', 'marketing', 'finance', 'legal', 'management', 'research-development'];
  categories.forEach(category => {
    xml += `  <url>
    <loc>${SITE_URL}/jobs?category=${category}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

`;
  });
  
  // 3. Company pages
  companies.forEach((company) => {
    xml += `  <url>
    <loc>${SITE_URL}/company/${company.slug}</loc>
    <lastmod>${company.updated_at || now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

`;
  });
  
  // 4. Individual job pages (THE MOST IMPORTANT!)
  jobs.forEach((job) => {
    const company = companies.get(job.company_id);
    if (!company) return;
    
    const jobSlug = generateJobSlug(job, company.slug);
    const lastmod = job.updated_at || now;
    
    xml += `  <url>
    <loc>${SITE_URL}/job/${jobSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

`;
  });
  
  // 5. Static pages
  const staticPages = ['about', 'contact', 'privacy', 'terms'];
  staticPages.forEach(page => {
    xml += `  <url>
    <loc>${SITE_URL}/${page}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

`;
  });
  
  xml += `</urlset>`;
  
  return xml;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 SITEMAP GENERATOR FOR ACROSSJOB.COM\n');
  console.log('=' .repeat(60));
  
  try {
    // Fetch data
    const { jobs, companies } = await fetchAllJobs();
    
    if (jobs.length === 0) {
      console.warn('⚠️  No active jobs found. Sitemap will only contain static pages.');
    }
    
    // Generate XML
    console.log('\n🔨 Generating sitemap XML...');
    const sitemapXML = generateSitemapXML(jobs, companies);
    
    // Calculate URLs
    const totalURLs = 1 + // homepage
                      7 + // category pages
                      companies.size + // company pages
                      jobs.length + // job pages
                      4; // static pages
    
    console.log(`   ✅ Generated ${totalURLs.toLocaleString()} URLs`);
    
    // Write to file
    const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, sitemapXML, 'utf-8');
    console.log(`   ✅ Sitemap written to: ${outputPath}`);
    
    // Statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 SITEMAP SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Homepage:        1 URL`);
    console.log(`   Categories:      7 URLs`);
    console.log(`   Companies:       ${companies.size} URLs`);
    console.log(`   Jobs:            ${jobs.length.toLocaleString()} URLs`);
    console.log(`   Static pages:    4 URLs`);
    console.log(`   ────────────────────────────`);
    console.log(`   TOTAL:           ${totalURLs.toLocaleString()} URLs`);
    console.log('='.repeat(60));
    
    console.log('\n✅ Sitemap generation complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify sitemap: https://acrossjob.com/sitemap.xml');
    console.log('   2. Submit to Google Search Console');
    console.log('   3. Add to robots.txt: Sitemap: https://acrossjob.com/sitemap.xml');
    console.log('   4. Set up automatic generation (GitHub Actions or cron)');
    
  } catch (error) {
    console.error('\n❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

main();
