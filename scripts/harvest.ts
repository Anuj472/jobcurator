#!/usr/bin/env tsx
/**
 * Automated Job Harvester with Smart Lifecycle Management
 * VERSION: 2.4 - FIXED EXPIRED JOBS QUERY
 * - Fetches jobs daily from all configured companies
 * - Marks expired/closed jobs as inactive automatically
 * - Uses Title Case with spaces for experience levels to match database
 * - Fixed array handling for marking expired jobs
 * - Keeps database fresh and accurate
 */

import { createClient } from '@supabase/supabase-js';
import { AtsService } from '../services/atsService';
import { INITIAL_COMPANIES } from '../constants';
import { Job, AtsPlatform, JobCategory, JobType, ExperienceLevel } from '../types';

const HARVEST_VERSION = '2.4-FIXED-EXPIRED-QUERY';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\u274c Missing Supabase credentials!');
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
 * Experience level detection (Title Case with spaces)
 * Priority order: Executive > Lead > Senior Level > Entry Level > Mid Level (default)
 */
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
  
  // Entry level (Junior, Graduate, New Grad, Intern - all mapped to Entry Level)
  const entryKeywords = ['junior', 'jr.', 'jr ', 'graduate', 'entry', 'associate', 'intern', 'new grad', 'apprentice'];
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
      .from('jobs')
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
      console.error(`\u274c Company creation failed for ${companyName}:`, error);
      return null;
    }
    
    console.log(`\u2705 Created company: ${companyName}`);
    return created?.id || null;
  } catch (err) {
    console.error(`\u274c Error in getOrCreateCompanyId:`, err);
    return null;
  }
};

/**
 * Mark expired jobs as inactive
 * FIXED: Fetch and filter approach instead of complex NOT IN query
 */
const markExpiredJobs = async (companyId: string, activeApplyLinks: string[]): Promise<number> => {
  try {
    if (activeApplyLinks.length === 0) {
      console.log('   \u26a0\ufe0f No active jobs to compare against');
      return 0;
    }

    // Fetch all currently active jobs for this company
    const { data: existingJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, apply_link')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (fetchError) {
      console.error('   \u274c Error fetching existing jobs:', fetchError.message);
      return 0;
    }

    if (!existingJobs || existingJobs.length === 0) {
      return 0;
    }

    // Find jobs that are NO LONGER in the active list
    const activeLinksSet = new Set(activeApplyLinks);
    const expiredJobIds = existingJobs
      .filter(job => !activeLinksSet.has(job.apply_link))
      .map(job => job.id);

    if (expiredJobIds.length === 0) {
      return 0;
    }

    // Mark them as inactive
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .in('id', expiredJobIds);

    if (updateError) {
      console.error('   \u274c Error updating expired jobs:', updateError.message);
      return 0;
    }

    console.log(`   \ud83d\udd04 Marked ${expiredJobIds.length} expired jobs as inactive`);
    return expiredJobIds.length;
  } catch (err: any) {
    console.error('   \u274c Exception marking expired jobs:', err.message);
    return 0;
  }
};

const harvestAndSync = async () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`\ud83d\ude80 JOB HARVESTER WITH LIFECYCLE MANAGEMENT`);
  console.log(`   Version: ${HARVEST_VERSION} \u2b50`);
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
      console.log(`\n\ud83d\udce6 Processing: ${company.name}`);
      
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
        console.error(`   \u274c Failed to get company ID`);
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
        console.error(`   \u274c Database error:`, upsertError.message);
        totalFailed += normalizedJobs.length;
        continue;
      }

      const syncedCount = upsertedData?.length || 0;
      totalSynced += syncedCount;
      console.log(`   \u2705 Synced ${syncedCount} active jobs`);

      // STEP 2: Mark jobs that are NO LONGER in ATS as inactive
      const expiredCount = await markExpiredJobs(companyId, activeApplyLinks);
      totalExpired += expiredCount;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err: any) {
      console.error(`   \u274c Error processing ${company.name}:`, err.message);
      totalFailed++;
    }
  }

  // STEP 3: Optional - Delete very old inactive jobs (older than 30 days)
  console.log(`\n\ud83e\uddf9 Cleaning up very old inactive jobs...`);
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
    console.log(`   \ud83d\uddd1\ufe0f Deleted ${deletedCount} jobs inactive for >30 days`);
  } else {
    console.log(`   \u2705 No old inactive jobs to delete`);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`\ud83d\udcca HARVEST SUMMARY`);
  console.log(`${'='.repeat(70)}`);
  console.log(`   Companies processed: ${INITIAL_COMPANIES.length}`);
  console.log(`   Jobs found on ATS: ${totalFound}`);
  console.log(`   Jobs synced/updated: ${totalSynced}`);
  console.log(`   Jobs marked expired: ${totalExpired}`);
  console.log(`   Jobs deleted (>30d old): ${deletedCount}`);
  console.log(`   Jobs failed: ${totalFailed}`);
  console.log(`\n\ud83d\udcc2 Category Distribution:`);
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
  console.log(`\n\ud83c\udfaf Experience Level Distribution:`);
  Object.entries(experienceStats)
    .sort((a, b) => {
      // Custom sort order: Entry Level, Mid Level, Senior Level, Lead, Executive
      const order = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'];
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
    console.log('\u2705 Harvest completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\u274c Harvest failed:', err);
    process.exit(1);
  });
