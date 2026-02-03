import { createClient } from '@supabase/supabase-js';
import { LinkedInService } from '../services/linkedinService';
import { Job } from '../types';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN!;
const LINKEDIN_AUTHOR_URN = process.env.LINKEDIN_AUTHOR_URN!;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize LinkedIn Service
let linkedinService: LinkedInService;

/**
 * Get all unique countries from the database
 */
async function getAllCountries(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('country')
      .not('country', 'is', null);

    if (error) throw error;

    // Get unique countries
    const countries = [...new Set(data.map((job: any) => job.country))];
    console.log(`🌍 Found ${countries.length} unique countries`);
    return countries.filter(Boolean) as string[];
  } catch (error) {
    console.error('❌ Error fetching countries:', error);
    return [];
  }
}

/**
 * Get a random job from a specific country
 */
async function getRandomJobByCountry(country: string): Promise<Job | null> {
  try {
    // Get total count for this country
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('country', country)
      .eq('status', 'active');

    if (countError || !count || count === 0) {
      console.log(`⚠️ No active jobs found for ${country}`);
      return null;
    }

    // Get a random offset
    const randomOffset = Math.floor(Math.random() * count);

    // Fetch one random job
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('country', country)
      .eq('status', 'active')
      .range(randomOffset, randomOffset)
      .limit(1)
      .single();

    if (error || !data) {
      console.log(`⚠️ Could not fetch job for ${country}`);
      return null;
    }

    console.log(`✅ Found job for ${country}: ${data.title} at ${data.company}`);
    return data as Job;
  } catch (error) {
    console.error(`❌ Error fetching job for ${country}:`, error);
    return null;
  }
}

/**
 * Post jobs to LinkedIn with delays
 */
async function postJobsWithDelay() {
  console.log('🚀 Starting LinkedIn job posting automation...\n');

  const countries = await getAllCountries();
  
  if (countries.length === 0) {
    console.log('❌ No countries found in database');
    return;
  }

  console.log(`🎯 Will post jobs for ${countries.length} countries\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    console.log(`\n[${i + 1}/${countries.length}] Processing ${country}...`);

    // Get random job for this country
    const job = await getRandomJobByCountry(country);

    if (!job) {
      failCount++;
      console.log(`⚠️ Skipping ${country} - no jobs available`);
      continue;
    }

    // Post to LinkedIn
    const posted = await linkedinService.postJob(
      {
        title: job.title,
        company: job.company,
        location: `${job.city || ''}${job.city && job.country ? ', ' : ''}${job.country || ''}`.trim(),
        description: job.description || 'Click the link to view full job description.',
        url: job.url,
        salary: job.salary_range,
        type: job.job_type,
      },
      LINKEDIN_AUTHOR_URN
    );

    if (posted) {
      successCount++;
    } else {
      failCount++;
    }

    // Wait 20 minutes before posting next job (except for the last one)
    if (i < countries.length - 1) {
      const delayMinutes = 20;
      console.log(`⏳ Waiting ${delayMinutes} minutes before next post...`);
      await new Promise(resolve => setTimeout(resolve, delayMinutes * 60 * 1000));
    }
  }

  console.log(`\n✅ Job posting completed!`);
  console.log(`🎯 Successfully posted: ${successCount}`);
  console.log(`❌ Failed/Skipped: ${failCount}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase credentials');
    }

    if (!LINKEDIN_ACCESS_TOKEN) {
      throw new Error('Missing LINKEDIN_ACCESS_TOKEN. Get it using tools/get-linkedin-urn.html');
    }

    if (!LINKEDIN_AUTHOR_URN) {
      console.log('⚠️ LINKEDIN_AUTHOR_URN not set. Attempting to fetch...');
      linkedinService = new LinkedInService(LINKEDIN_ACCESS_TOKEN);
      const urn = await linkedinService.getUserUrn();
      console.log(`ℹ️ Set this as your LINKEDIN_AUTHOR_URN secret: ${urn}`);
      return;
    }

    // Initialize service
    linkedinService = new LinkedInService(LINKEDIN_ACCESS_TOKEN);

    // Validate token
    const isValid = await linkedinService.validateToken();
    if (!isValid) {
      throw new Error('LinkedIn access token is invalid or expired');
    }

    console.log('✅ LinkedIn access token validated');

    await postJobsWithDelay();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();