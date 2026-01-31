#!/usr/bin/env tsx
/**
 * Automated Job Harvester - Fixed for acrossjobs filters
 * Runs daily to fetch and sync jobs from all configured companies
 * Ensures all fields required for acrossjobs filters are properly set
 */

import { createClient } from '@supabase/supabase-js';
import { AtsService } from '../services/atsService';
import { INITIAL_COMPANIES } from '../constants';
import { Job, AtsPlatform, JobCategory, JobType } from '../types';

type ExperienceLevel = 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Lead' | 'Executive' | null;

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Category mapping logic (same as App.tsx)
const mapToJobCategory = (rawDept: string | undefined, title: string | undefined): JobCategory => {
  const combined = `${rawDept || ''} ${title || ''}`.toLowerCase();
  
  const salesKeywords = ['sales', 'account executive', 'ae ', 'business development', 'bdr', 'sdr', 'revenue', 'account manager', 'customer success', 'partnerships', 'commercial'];
  if (salesKeywords.some(kw => combined.includes(kw))) return 'sales';
  
  const marketingKeywords = ['marketing', 'brand', 'growth', 'content', 'seo', 'sem', 'digital marketing', 'campaign', 'social media', 'community', 'creative', 'copywriter'];
  if (marketingKeywords.some(kw => combined.includes(kw))) return 'marketing';
  
  const financeKeywords = ['finance', 'accounting', 'controller', 'financial', 'audit', 'fp&a', 'cfo', 'tax', 'payroll'];
  if (financeKeywords.some(kw => combined.includes(kw))) return 'finance';
  
  const legalKeywords = ['legal', 'attorney', 'counsel', 'compliance', 'lawyer', 'paralegal', 'regulatory', 'contracts'];
  if (legalKeywords.some(kw => combined.includes(kw))) return 'legal';
  
  const researchKeywords = ['research', 'scientist', 'science', 'r&d', 'algorithm', 'lab', 'phd', 'postdoc', 'ml researcher', 'ai researcher'];
  if (researchKeywords.some(kw => combined.includes(kw))) return 'research-development';
  
  const managementKeywords = ['ceo', 'cto', 'coo', 'cmo', 'chief', 'vp ', 'vice president', 'director of', 'head of', 'hr ', 'human resources', 'people ops'];
  if (managementKeywords.some(kw => combined.includes(kw))) return 'management';
  
  const itKeywords = ['engineer', 'developer', 'software', 'frontend', 'backend', 'devops', 'sre', 'architect', 'programming', 'cloud', 'security'];
  if (itKeywords.some(kw => combined.includes(kw))) return 'it';
  
  return 'it'; // Default
};

const mapToJobType = (location: string | undefined, title: string | undefined): JobType => {
  const combined = `${location || ''} ${title || ''}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('anywhere')) return 'Remote';
  if (combined.includes('hybrid')) return 'Hybrid';
  return 'On-site';
};

// NEW: Experience level detection based on job title
const mapToExperienceLevel = (title: string | undefined, description: string | undefined): ExperienceLevel => {
  const combined = `${title || ''} ${description || ''}`.toLowerCase();
  
  // Executive level (C-suite, VP, Directors)
  const executiveKeywords = ['ceo', 'cto', 'coo', 'cfo', 'cmo', 'chief', 'vp ', 'vice president', 'executive director', 'managing director'];
  if (executiveKeywords.some(kw => combined.includes(kw))) return 'Executive';
  
  // Lead level (Team leads, Principal, Staff+)
  const leadKeywords = ['lead ', 'principal', 'staff engineer', 'staff developer', 'architect', 'head of'];
  if (leadKeywords.some(kw => combined.includes(kw))) return 'Lead';
  
  // Senior level
  const seniorKeywords = ['senior', 'sr.', 'sr ', 'expert'];
  if (seniorKeywords.some(kw => combined.includes(kw))) return 'Senior Level';
  
  // Entry level (Intern, Junior, Graduate, Associate)
  const entryKeywords = ['intern', 'junior', 'jr.', 'jr ', 'graduate', 'entry', 'associate', 'trainee'];
  if (entryKeywords.some(kw => combined.includes(kw))) return 'Entry Level';
  
  // Default to Mid Level (most common for non-specified roles)
  return 'Mid Level';
};

const getOrCreateCompanyId = async (
  companyName: string, 
  atsPlatform?: AtsPlatform, 
  atsIdentifier?: string
): Promise<string | null> => {
  try {
    const slug = AtsService.generateSlug(companyName);
    
    // Try to find existing company
    let { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (existing) return existing.id;

    // Create new company
    const { data: created, error } = await supabase
      .from('companies')
      .insert({ 
        name: companyName,
        slug,
        logo_url: `https://logo.clearbit.com/${slug}.com`,
        website_url: `https://www.${slug}.com`,
        auto_created: true,
        ats_platform: atsPlatform,
        ats_identifier: atsIdentifier,
        verified: false
      })
      .select('id')
      .single();
    
    if (error) {
      console.error(`❌ Company creation failed for ${companyName}:`, error);
      return null;
    }
    
    console.log(`✅ Created company: ${companyName}`);
    return created?.id || null;
  } catch (err) {
    console.error(`❌ Error in getOrCreateCompanyId:`, err);
    return null;
  }
};

const harvestAndSync = async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 JOB HARVESTER - ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}\n`);

  let totalFound = 0;
  let totalSynced = 0;
  let totalFailed = 0;
  let categoryStats: Record<string, number> = {};
  let experienceStats: Record<string, number> = {};

  for (const company of INITIAL_COMPANIES) {
    try {
      console.log(`\n📦 Processing: ${company.name}`);
      
      // Fetch jobs from ATS
      let rawJobs: any[] = [];
      if (company.platform === AtsPlatform.GREENHOUSE) {
        rawJobs = await AtsService.fetchGreenhouseJobs(company.identifier);
      } else if (company.platform === AtsPlatform.LEVER) {
        rawJobs = await AtsService.fetchLeverJobs(company.identifier);
      } else if (company.platform === AtsPlatform.ASHBY) {
        rawJobs = await AtsService.fetchAshbyJobs(company.identifier);
      }

      console.log(`   Found ${rawJobs.length} jobs`);
      totalFound += rawJobs.length;

      if (rawJobs.length === 0) continue;

      // Get or create company
      const companyId = await getOrCreateCompanyId(
        company.name,
        company.platform,
        company.identifier
      );

      if (!companyId) {
        console.error(`   ❌ Failed to get company ID`);
        totalFailed += rawJobs.length;
        continue;
      }

      // Normalize jobs with ALL required fields
      const normalizedJobs = rawJobs.map(j => {
        let norm: Partial<Job>;
        if (company.platform === AtsPlatform.GREENHOUSE) {
          norm = AtsService.normalizeGreenhouse(j, '');
        } else if (company.platform === AtsPlatform.LEVER) {
          norm = AtsService.normalizeLever(j, '');
        } else {
          norm = AtsService.normalizeAshby(j, '');
        }

        const category = mapToJobCategory(norm.category, norm.title);
        const jobType = mapToJobType(norm.location_city, norm.title);
        const experienceLevel = mapToExperienceLevel(norm.title, norm.description);

        // Track stats
        categoryStats[category] = (categoryStats[category] || 0) + 1;
        experienceStats[experienceLevel || 'null'] = (experienceStats[experienceLevel || 'null'] || 0) + 1;

        return {
          company_id: companyId,
          title: norm.title!,
          category: category,
          location_city: norm.location_city || 'Remote',
          location_country: norm.location_country || 'Global',
          job_type: jobType,
          experience_level: experienceLevel, // CRITICAL: Now properly set
          apply_link: norm.apply_link!,
          description: norm.description || '',
          is_active: true
        };
      }).filter(j => j.title && j.apply_link);

      // Insert to database
      const { data, error } = await supabase
        .from('jobs')
        .upsert(normalizedJobs, { onConflict: 'apply_link' })
        .select();

      if (error) {
        console.error(`   ❌ Database error:`, error.message);
        totalFailed += normalizedJobs.length;
      } else {
        console.log(`   ✅ Synced ${normalizedJobs.length} jobs`);
        totalSynced += normalizedJobs.length;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err: any) {
      console.error(`   ❌ Error processing ${company.name}:`, err.message);
      totalFailed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 HARVEST SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   Companies processed: ${INITIAL_COMPANIES.length}`);
  console.log(`   Jobs found: ${totalFound}`);
  console.log(`   Jobs synced: ${totalSynced}`);
  console.log(`   Jobs failed: ${totalFailed}`);
  console.log(`\n📂 Category Distribution:`);
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
  console.log(`\n🎯 Experience Level Distribution:`);
  Object.entries(experienceStats).forEach(([level, count]) => {
    console.log(`   ${level}: ${count}`);
  });
  console.log(`${'='.repeat(60)}\n`);
};

// Run the harvester
harvestAndSync()
  .then(() => {
    console.log('✅ Harvest completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Harvest failed:', err);
    process.exit(1);
  });
