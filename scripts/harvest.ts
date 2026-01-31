#!/usr/bin/env tsx
/**
 * Automated Job Harvester with Smart Lifecycle Management
 * VERSION: 2.0 - WITH INTERNSHIP DETECTION
 * - Fetches jobs daily from all configured companies
 * - Marks expired/closed jobs as inactive automatically
 * - Detects internships/apprenticeships as separate experience level
 * - Keeps database fresh and accurate
 */

import { createClient } from '@supabase/supabase-js';
import { AtsService } from '../services/atsService';
import { INITIAL_COMPANIES } from '../constants';
import { Job, AtsPlatform, JobCategory, JobType } from '../types';

type ExperienceLevel = 'Internship' | 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Lead' | 'Executive' | null;

const HARVEST_VERSION = '2.0-INTERNSHIP';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Category mapping logic
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
  
  return 'it';
};

const mapToJobType = (location: string | undefined, title: string | undefined): JobType => {
  const combined = `${location || ''} ${title || ''}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('anywhere')) return 'Remote';
  if (combined.includes('hybrid')) return 'Hybrid';
  return 'On-site';
};

/**
 * Experience level detection with INTERNSHIP support
 * Priority order: Internship > Executive > Lead > Senior > Entry > Mid (default)
 */
const mapToExperienceLevel = (title: string | undefined, description: string | undefined): ExperienceLevel => {
  const combined = `${title || ''} ${description || ''}`.toLowerCase();
  
  // INTERNSHIP - Check FIRST (highest priority for students)
  const internshipKeywords = [
    'intern ',
    'internship',
    'apprentice',
    'apprenticeship',
    'co-op',
    'coop',
    'student',
    'trainee',
    'campus',
    'new grad',
    'new graduate',
    'university program'
  ];
  if (internshipKeywords.some(kw => combined.includes(kw))) return 'Internship';
  
  // Executive level (C-suite, VP, Directors)
  const executiveKeywords = ['ceo', 'cto', 'coo', 'cfo', 'cmo', 'chief', 'vp ', 'vice president', 'executive director', 'managing director'];
  if (executiveKeywords.some(kw => combined.includes(kw))) return 'Executive';
  
  // Lead level (Team leads, Principal, Staff+)
  const leadKeywords = ['lead ', 'principal', 'staff engineer', 'staff developer', 'architect', 'head of'];
  if (leadKeywords.some(kw => combined.includes(kw))) return 'Lead';
  
  // Senior level
  const seniorKeywords = ['senior', 'sr.', 'sr ', 'expert'];
  if (seniorKeywords.some(kw => combined.includes(kw))) return 'Senior Level';
  
  // Entry level (Junior, Graduate - but NOT intern)
  // Note: We already filtered out internships above
  const entryKeywords = ['junior', 'jr.', 'jr ', 'graduate', 'entry', 'associate'];
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
    
    let { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (existing) return existing.id;

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

/**
 * Mark expired jobs as inactive
 * Jobs that are no longer in the ATS are marked as is_active: false
 */
const markExpiredJobs = async (companyId: string, activeApplyLinks: string[]): Promise<number> => {
  try {
    if (activeApplyLinks.length === 0) {
      console.log('   ⚠️ No active jobs to compare against');
      return 0;
    }

    // Mark all jobs NOT in the current active list as inactive
    const { data, error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .eq('company_id', companyId)
      .eq('is_active', true)  // Only update currently active jobs
      .not('apply_link', 'in', `(${activeApplyLinks.map(link => `"${link}"`).join(',')})`)
      .select('id');

    if (error) {
      console.error('   ❌ Error marking expired jobs:', error.message);
      return 0;
    }

    const expiredCount = data?.length || 0;
    if (expiredCount > 0) {
      console.log(`   🔄 Marked ${expiredCount} expired jobs as inactive`);
    }
    return expiredCount;
  } catch (err: any) {
    console.error('   ❌ Exception marking expired jobs:', err.message);
    return 0;
  }
};

const harvestAndSync = async () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 JOB HARVESTER WITH LIFECYCLE MANAGEMENT`);
  console.log(`   Version: ${HARVEST_VERSION} ⭐`);
  console.log(`   Started: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(70)}\n`);

  let totalFound = 0;
  let totalSynced = 0;
  let totalUpdated = 0;
  let totalExpired = 0;
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

      console.log(`   Found ${rawJobs.length} active jobs on ATS`);
      totalFound += rawJobs.length;

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

      if (rawJobs.length === 0) {
        // If company has zero jobs, mark all existing jobs as inactive
        const expired = await markExpiredJobs(companyId, []);
        totalExpired += expired;
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

        categoryStats[category] = (categoryStats[category] || 0) + 1;
        experienceStats[experienceLevel || 'null'] = (experienceStats[experienceLevel || 'null'] || 0) + 1;

        return {
          company_id: companyId,
          title: norm.title!,
          category: category,
          location_city: norm.location_city || 'Remote',
          location_country: norm.location_country || 'Global',
          job_type: jobType,
          experience_level: experienceLevel,
          apply_link: norm.apply_link!,
          description: norm.description || '',
          is_active: true  // Mark as active since it's currently on ATS
        };
      }).filter(j => j.title && j.apply_link);

      // Collect all active apply links for this company
      const activeApplyLinks = normalizedJobs.map(j => j.apply_link);

      // STEP 1: Upsert current active jobs
      const { data: upsertedData, error: upsertError } = await supabase
        .from('jobs')
        .upsert(normalizedJobs, { onConflict: 'apply_link' })
        .select('id, apply_link');

      if (upsertError) {
        console.error(`   ❌ Database error:`, upsertError.message);
        totalFailed += normalizedJobs.length;
        continue;
      }

      const syncedCount = upsertedData?.length || 0;
      totalSynced += syncedCount;
      console.log(`   ✅ Synced ${syncedCount} active jobs`);

      // STEP 2: Mark jobs that are NO LONGER in ATS as inactive
      const expiredCount = await markExpiredJobs(companyId, activeApplyLinks);
      totalExpired += expiredCount;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err: any) {
      console.error(`   ❌ Error processing ${company.name}:`, err.message);
      totalFailed++;
    }
  }

  // STEP 3: Optional - Delete very old inactive jobs (older than 30 days)
  console.log(`\n🧹 Cleaning up very old inactive jobs...`);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: deletedJobs, error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .eq('is_active', false)
    .lt('updated_at', thirtyDaysAgo.toISOString())
    .select('id');
  
  const deletedCount = deletedJobs?.length || 0;
  if (deletedCount > 0) {
    console.log(`   🗑️ Deleted ${deletedCount} jobs inactive for >30 days`);
  } else {
    console.log(`   ✅ No old inactive jobs to delete`);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 HARVEST SUMMARY`);
  console.log(`${'='.repeat(70)}`);
  console.log(`   Companies processed: ${INITIAL_COMPANIES.length}`);
  console.log(`   Jobs found on ATS: ${totalFound}`);
  console.log(`   Jobs synced/updated: ${totalSynced}`);
  console.log(`   Jobs marked expired: ${totalExpired}`);
  console.log(`   Jobs deleted (>30d old): ${deletedCount}`);
  console.log(`   Jobs failed: ${totalFailed}`);
  console.log(`\n📂 Category Distribution:`);
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
  console.log(`\n🎯 Experience Level Distribution:`);
  Object.entries(experienceStats)
    .sort((a, b) => {
      // Custom sort order: Internship, Entry, Mid, Senior, Lead, Executive
      const order = ['Internship', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    })
    .forEach(([level, count]) => {
      console.log(`   ${level}: ${count}`);
    });
  console.log(`${'='.repeat(70)}\n`);
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
