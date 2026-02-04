import { createClient } from '@supabase/supabase-js';
import { LinkedInService } from '../services/linkedinService';
import { Job } from '../types';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN!;
const LINKEDIN_AUTHOR_URN = process.env.LINKEDIN_AUTHOR_URN!;

// Configuration
const JOBS_PER_POST = 5;
const POSTS_PER_RUN = 2;
const DELAY_BETWEEN_POSTS_MINUTES = 20;
const NO_REPEAT_DAYS = 30;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize LinkedIn Service
let linkedinService: LinkedInService;

/**
 * Get jobs that haven't been posted to LinkedIn in the last 30 days
 */
async function getUnpostedJobs(limit: number): Promise<Job[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - NO_REPEAT_DAYS);

    // Query for jobs that either:
    // 1. Have never been posted (linkedin_posted_at is null)
    // 2. Were posted more than 30 days ago
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .or(`linkedin_posted_at.is.null,linkedin_posted_at.lt.${thirtyDaysAgo.toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Get more than needed for randomization

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No unposted jobs found');
      return [];
    }

    // Shuffle and take only the needed amount
    const shuffled = data.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, limit);

    console.log(`✅ Found ${data.length} unposted jobs, selected ${selected.length}`);
    return selected as Job[];
  } catch (error) {
    console.error('❌ Error in getUnpostedJobs:', error);
    return [];
  }
}

/**
 * Mark jobs as posted to LinkedIn
 */
async function markJobsAsPosted(jobIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('jobs')
      .update({ linkedin_posted_at: new Date().toISOString() })
      .in('id', jobIds);

    if (error) {
      console.error('❌ Error marking jobs as posted:', error);
    } else {
      console.log(`✅ Marked ${jobIds.length} jobs as posted`);
    }
  } catch (error) {
    console.error('❌ Error in markJobsAsPosted:', error);
  }
}

/**
 * Format job data for LinkedIn posting
 */
function formatJobForPost(job: Job) {
  // Create apply URL on acrossjob.com
  const applyUrl = `https://acrossjob.com/jobs/${job.id}`;
  
  return {
    title: job.title,
    company: job.company,
    location: `${job.city || ''}${job.city && job.country ? ', ' : ''}${job.country || ''}`.trim() || 'Remote',
    description: job.description || 'Click the link to view full job description.',
    url: applyUrl,
    salary: job.salary_range || undefined,
    type: job.job_type || undefined,
  };
}

/**
 * Post a batch of jobs to LinkedIn
 */
async function postJobBatch(batchNumber: number): Promise<boolean> {
  console.log(`\n📦 Preparing batch ${batchNumber}...`);

  // Get unposted jobs
  const jobs = await getUnpostedJobs(JOBS_PER_POST);

  if (jobs.length === 0) {
    console.log(`⚠️ No jobs available for batch ${batchNumber}`);
    return false;
  }

  if (jobs.length < JOBS_PER_POST) {
    console.log(`⚠️ Only ${jobs.length} jobs available (wanted ${JOBS_PER_POST})`);
  }

  // Format jobs for posting
  const formattedJobs = jobs.map(formatJobForPost);

  // Log jobs being posted
  console.log(`\n📝 Batch ${batchNumber} contains:`);
  formattedJobs.forEach((job, index) => {
    console.log(`  ${index + 1}. ${job.title} at ${job.company} (${job.location})`);
  });

  // Post to LinkedIn
  const posted = await linkedinService.postBatchJobs(formattedJobs, LINKEDIN_AUTHOR_URN);

  if (posted) {
    // Mark these jobs as posted
    const jobIds = jobs.map(job => job.id);
    await markJobsAsPosted(jobIds);
    console.log(`✅ Batch ${batchNumber} posted successfully!`);
    return true;
  } else {
    console.log(`❌ Batch ${batchNumber} failed to post`);
    return false;
  }
}

/**
 * Main execution - Post 2 batches with delay
 */
async function main() {
  try {
    console.log('🚀 Starting daily LinkedIn job posting...\n');
    console.log(`📋 Configuration:`);
    console.log(`  - Posts per run: ${POSTS_PER_RUN}`);
    console.log(`  - Jobs per post: ${JOBS_PER_POST}`);
    console.log(`  - Total jobs: ${POSTS_PER_RUN * JOBS_PER_POST}`);
    console.log(`  - Delay between posts: ${DELAY_BETWEEN_POSTS_MINUTES} minutes`);
    console.log(`  - No-repeat period: ${NO_REPEAT_DAYS} days\n`);

    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    if (!LINKEDIN_ACCESS_TOKEN) {
      throw new Error('Missing LINKEDIN_ACCESS_TOKEN');
    }

    if (!LINKEDIN_AUTHOR_URN) {
      throw new Error('Missing LINKEDIN_AUTHOR_URN');
    }

    console.log(`✅ Using provided LinkedIn Author URN: ${LINKEDIN_AUTHOR_URN}`);
    console.log(`📝 Token length: ${LINKEDIN_ACCESS_TOKEN.length} characters`);
    console.log(`⚠️ Skipping token validation (only posting permission needed)\n`);

    // Initialize LinkedIn service
    linkedinService = new LinkedInService(LINKEDIN_ACCESS_TOKEN);

    let successCount = 0;
    let failCount = 0;

    // Post batches
    for (let i = 1; i <= POSTS_PER_RUN; i++) {
      const success = await postJobBatch(i);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Wait between posts (except after the last one)
      if (i < POSTS_PER_RUN) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_POSTS_MINUTES} minutes before next post...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_POSTS_MINUTES * 60 * 1000));
      }
    }

    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎯 DAILY POSTING COMPLETE`);
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Successful posts: ${successCount}`);
    console.log(`❌ Failed posts: ${failCount}`);
    console.log(`📊 Total jobs posted: ${successCount * JOBS_PER_POST}`);
    console.log(`${'='.repeat(50)}\n`);

    if (failCount > 0) {
      console.log(`⚠️ Some posts failed. Check the logs above for details.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();