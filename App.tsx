import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Job, Company, AtsPlatform, JobCategory, JobType } from './types';
import { JobCard } from './components/JobCard';
import { AtsService } from './services/atsService';
import { INITIAL_COMPANIES } from './constants';

interface CompanySyncStatus {
  name: string;
  uuid: string;
  found: number;
  synced: number;
  failed: number;
  lastError?: string;
}

interface SyncProgress {
  currentCompany: string;
  processedCount: number;
  totalToSync: number;
  successCount: number;
  errorCount: number;
  companyStats: Record<string, CompanySyncStatus>;
}

const JOBS_PER_PAGE = 50; // Pagination limit

const App: React.FC = () => {
  const [discoveredJobs, setDiscoveredJobs] = useState<Partial<Job>[]>([]);
  const [syncedApplyLinks, setSyncedApplyLinks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pushingAll, setPushingAll] = useState(false);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'discovery' | 'database'>('discovery');
  const [dbJobs, setDbJobs] = useState<Job[]>([]);
  const [progress, setProgress] = useState(0);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchSyncedLinks();
    if (activeTab === 'database') {
      setCurrentPage(0);
      setDbJobs([]);
      fetchDbJobs(0);
    }
  }, [activeTab]);

  const fetchSyncedLinks = async () => {
    try {
      const { data } = await supabase.from('jobs').select('apply_link').eq('is_active', true);
      if (data) setSyncedApplyLinks(new Set(data.map(j => j.apply_link)));
    } catch (e) {
      console.error('❌ Error fetching synced links:', e);
    }
  };

  const fetchDbJobs = async (page: number = 0, append: boolean = false) => {
    setLoading(true);
    setDbError(null);
    
    try {
      const from = page * JOBS_PER_PAGE;
      const to = from + JOBS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('jobs')
        .select('*, company:companies(*)', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      if (data) {
        if (append) {
          setDbJobs(prev => [...prev, ...data as any[]]);
        } else {
          setDbJobs(data as any[]);
        }
        setHasMore(data.length === JOBS_PER_PAGE && (count || 0) > to + 1);
      }
    } catch (e: any) {
      console.error('❌ Exception fetching DB jobs:', e);
      // User-friendly error message - NO sensitive info exposed
      setDbError('Unable to load jobs. Please refresh the page or try again later.');
      setDbJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchDbJobs(nextPage, true);
  };

  const mapToJobCategory = (rawDept: string | undefined, title: string | undefined): JobCategory => {
    const combined = `${rawDept || ''} ${title || ''}`.toLowerCase();
    
    // ===== SALES =====
    const salesKeywords = [
      'sales', 'account executive', 'ae ', 'business development', 'bdr', 'sdr',
      'revenue', 'account manager', 'am ', 'customer success', 'cs ',
      'partnerships', 'partner', 'commercial', 'inside sales', 'outside sales',
      'enterprise sales', 'field sales', 'sales ops', 'sales operations',
      'sales enablement', 'go-to-market', 'gtm', 'customer acquisition'
    ];
    if (salesKeywords.some(kw => combined.includes(kw))) {
      return 'sales';
    }
    
    // ===== MARKETING =====
    const marketingKeywords = [
      'marketing', 'brand', 'growth', 'content', 'seo', 'sem', 'ppc',
      'digital marketing', 'campaign', 'social media', 'community',
      'creative', 'copywriter', 'copywriting', 'demand generation',
      'product marketing', 'marketing ops', 'marketing operations',
      'events', 'pr ', 'public relations', 'communications', 'comms',
      'influencer', 'paid media', 'performance marketing', 'growth marketing',
      'email marketing', 'marketing analyst', 'marketing manager'
    ];
    if (marketingKeywords.some(kw => combined.includes(kw))) {
      return 'marketing';
    }
    
    // ===== FINANCE =====
    const financeKeywords = [
      'finance', 'accounting', 'controller', 'financial', 'treasurer',
      'audit', 'fp&a', 'financial planning', 'cfo', 'accountant',
      'tax', 'payroll', 'accounts payable', 'accounts receivable',
      'billing', 'invoicing', 'budgeting', 'forecasting',
      'financial analyst', 'investment', 'equity', 'venture',
      'capital', 'fundraising', 'investor relations'
    ];
    if (financeKeywords.some(kw => combined.includes(kw))) {
      return 'finance';
    }
    
    // ===== LEGAL =====
    const legalKeywords = [
      'legal', 'attorney', 'counsel', 'compliance', 'lawyer',
      'paralegal', 'regulatory', 'contracts', 'litigation',
      'intellectual property', 'ip ', 'privacy', 'gdpr', 'data protection',
      'legal ops', 'legal operations', 'general counsel', 'gc ',
      'risk', 'policy', 'governance'
    ];
    if (legalKeywords.some(kw => combined.includes(kw))) {
      return 'legal';
    }
    
    // ===== RESEARCH & DEVELOPMENT =====
    const researchKeywords = [
      'research', 'scientist', 'science', 'r&d', 'algorithm',
      'lab', 'phd', 'postdoc', 'researcher', 'ml researcher',
      'ai researcher', 'data scientist', 'applied scientist'
    ];
    if (researchKeywords.some(kw => combined.includes(kw))) {
      return 'research-development';
    }
    
    // ===== MANAGEMENT & OPERATIONS =====
    const managementKeywords = [
      'ceo', 'cto', 'coo', 'cmo', 'chief', 'vp ', 'vice president',
      'president', 'director of', 'head of', 'general manager', 'gm '
    ];
    if (managementKeywords.some(kw => combined.includes(kw))) {
      return 'management';
    }
    
    // ===== HUMAN RESOURCES =====
    const hrKeywords = [
      'hr ', 'human resources', 'recruiter', 'recruitment', 'talent',
      'people ops', 'people operations', 'employee relations',
      'compensation', 'benefits', 'hrbp', 'hr partner'
    ];
    if (hrKeywords.some(kw => combined.includes(kw))) {
      return 'management'; // HR goes under management
    }
    
    // ===== IT (Default for tech jobs) =====
    const itKeywords = [
      'engineer', 'developer', 'software', 'frontend', 'backend', 'fullstack',
      'devops', 'sre', 'data engineer', 'ml engineer', 'ai engineer',
      'architect', 'technical', 'programming', 'coding', 'infrastructure',
      'cloud', 'security engineer', 'qa ', 'quality assurance', 'test',
      'mobile', 'ios', 'android', 'web', 'api', 'database', 'system'
    ];
    if (itKeywords.some(kw => combined.includes(kw))) {
      return 'it';
    }
    
    // Default to IT if no match (most companies on our list are tech)
    return 'it';
  };

  const mapToJobType = (location: string | undefined, title: string | undefined): JobType => {
    const combined = `${location || ''} ${title || ''}`.toLowerCase();
    if (combined.includes('remote') || combined.includes('anywhere') || combined.includes('wfh')) return 'Remote';
    if (combined.includes('hybrid')) return 'Hybrid';
    return 'On-site';
  };

  const getOrCreateCompanyId = async (
    companyName: string, 
    atsPlatform?: AtsPlatform, 
    atsIdentifier?: string
  ): Promise<{ id: string | null; wasCreated: boolean; error?: string }> => {
    try {
      console.log(`🔍 Looking up company: ${companyName}`);
      const slug = AtsService.generateSlug(companyName);
      
      // First: Try exact slug match
      let { data: existing, error: lookupError } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (lookupError) {
        console.error(`❌ Error looking up by slug:`, lookupError);
      }
      
      // Second: Try case-insensitive name match if slug didn't work
      if (!existing) {
        const { data: nameMatch, error: nameError } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', companyName)
          .maybeSingle();
        if (nameError) {
          console.error(`❌ Error looking up by name:`, nameError);
        }
        existing = nameMatch;
      }
      
      // Third: Try ATS identifier match if provided
      if (!existing && atsIdentifier && atsPlatform) {
        const { data: atsMatch, error: atsError } = await supabase
          .from('companies')
          .select('id')
          .eq('ats_platform', atsPlatform)
          .eq('ats_identifier', atsIdentifier)
          .maybeSingle();
        if (atsError) {
          console.error(`❌ Error looking up by ATS:`, atsError);
        }
        existing = atsMatch;
      }
      
      if (existing) {
        console.log(`✅ Found existing company: ${companyName} (${existing.id})`);
        return { id: existing.id, wasCreated: false };
      }

      // Create new company with enhanced metadata
      console.log(`📝 Creating new company: ${companyName}`);
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
        return { id: null, wasCreated: false, error: error.message };
      }
      
      console.log(`✅ Auto-created company: ${companyName} (${created.id})`);
      return { id: created?.id || null, wasCreated: true };
      
    } catch (err: any) {
      console.error(`❌ Exception in getOrCreateCompanyId for ${companyName}:`, err);
      return { id: null, wasCreated: false, error: err.message };
    }
  };

  const runMassiveHarvest = async () => {
    setLoading(true);
    setDiscoveredJobs([]);
    setProgress(0);
    setStatus('Initializing Global Harvester...');

    let allFound: Partial<Job>[] = [];
    const total = INITIAL_COMPANIES.length;
    let categoryCounts = { it: 0, sales: 0, marketing: 0, finance: 0, legal: 0, management: 0, 'research-development': 0 };

    for (let i = 0; i < total; i++) {
      const company = INITIAL_COMPANIES[i];
      setProgress(Math.round((i / total) * 100));
      setStatus(`Harvesting ${company.name} (${i + 1}/${total})...`);

      try {
        let raw: any[] = [];
        if (company.platform === AtsPlatform.GREENHOUSE) raw = await AtsService.fetchGreenhouseJobs(company.identifier);
        else if (company.platform === AtsPlatform.LEVER) raw = await AtsService.fetchLeverJobs(company.identifier);
        else if (company.platform === AtsPlatform.ASHBY) raw = await AtsService.fetchAshbyJobs(company.identifier);

        const normalized = raw.map(j => {
          let norm: Partial<Job>;
          if (company.platform === AtsPlatform.GREENHOUSE) norm = AtsService.normalizeGreenhouse(j, '');
          else if (company.platform === AtsPlatform.LEVER) norm = AtsService.normalizeLever(j, '');
          else norm = AtsService.normalizeAshby(j, '');

          const category = mapToJobCategory(norm.category, norm.title);
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;

          return {
            ...norm,
            company: { name: company.name, slug: AtsService.generateSlug(company.name) } as any,
            category,
            job_type: mapToJobType(norm.location_city, norm.title)
          };
        });

        allFound.push(...normalized);
        if (i % 3 === 0) setDiscoveredJobs([...allFound]);
      } catch (e) {
        console.error(`❌ Harvest failure for ${company.name}:`, e);
      }
    }

    setDiscoveredJobs(allFound);
    setLoading(false);
    setProgress(100);
    console.log('📊 Category Distribution:', categoryCounts);
    setStatus(`Harvest complete! Found ${allFound.length} roles (IT: ${categoryCounts.it}, Sales: ${categoryCounts.sales}, Marketing: ${categoryCounts.marketing}, Finance: ${categoryCounts.finance}, Legal: ${categoryCounts.legal})`);
  };

  const pushToDatabase = async () => {
    const unSynced = discoveredJobs.filter(j => j.apply_link && !syncedApplyLinks.has(j.apply_link));
    if (unSynced.length === 0) {
      setStatus('⚠️ All jobs already synced!');
      return;
    }

    console.log(`🚀 Starting sync of ${unSynced.length} jobs...`);
    setPushingAll(true);
    setSyncProgress({
      currentCompany: 'Connecting...',
      processedCount: 0,
      totalToSync: unSynced.length,
      successCount: 0,
      errorCount: 0,
      companyStats: {}
    });

    const groups = unSynced.reduce((acc, job) => {
      const name = job.company?.name || 'Unknown';
      if (!acc[name]) acc[name] = [];
      acc[name].push(job);
      return acc;
    }, {} as Record<string, Partial<Job>[]>);

    let companiesCreated = 0;
    let companiesFailed: string[] = [];
    let jobsSucceeded = 0;
    let jobsFailed = 0;

    for (const companyName of Object.keys(groups)) {
      const jobsInGroup = groups[companyName];
      console.log(`\n📦 Processing company: ${companyName} (${jobsInGroup.length} jobs)`);
      setSyncProgress(prev => prev ? { ...prev, currentCompany: companyName } : null);

      try {
        // Get company info from INITIAL_COMPANIES
        const company = INITIAL_COMPANIES.find(c => c.name === companyName);
        
        const result = await getOrCreateCompanyId(
          companyName,
          company?.platform,
          company?.identifier
        );
        
        if (!result.id) {
          throw new Error(result.error || "Company ID resolution failed");
        }
        
        if (result.wasCreated) {
          companiesCreated++;
        }

        // Validate and prepare payload
        const payload = jobsInGroup
          .filter(j => j.title && j.apply_link) // Only include jobs with required fields
          .map(j => ({
            company_id: result.id!,
            title: j.title!,
            category: j.category || 'it',
            location_city: j.location_city || 'Remote',
            location_country: j.location_country || 'Global',
            job_type: j.job_type || 'Remote',
            apply_link: j.apply_link!,
            description: j.description || '',
            is_active: true
          }));

        if (payload.length === 0) {
          console.warn(`⚠️ No valid jobs to sync for ${companyName}`);
          continue;
        }

        console.log(`💾 Inserting ${payload.length} jobs for ${companyName}...`);
        const { data, error } = await supabase
          .from('jobs')
          .upsert(payload, { onConflict: 'apply_link' })
          .select();
        
        if (error) {
          console.error(`❌ Supabase error for ${companyName}:`, error);
          throw error;
        }

        jobsSucceeded += payload.length;
        console.log(`✅ Successfully synced ${payload.length} jobs for ${companyName}`);

        setSyncProgress(prev => {
          if (!prev) return null;
          const stat = prev.companyStats[companyName] || { 
            name: companyName, 
            uuid: result.id!, 
            found: jobsInGroup.length, 
            synced: 0, 
            failed: 0 
          };
          stat.synced += payload.length;
          return {
            ...prev,
            processedCount: prev.processedCount + payload.length,
            successCount: prev.successCount + payload.length,
            companyStats: { ...prev.companyStats, [companyName]: stat }
          };
        });
      } catch (err: any) {
        companiesFailed.push(companyName);
        jobsFailed += jobsInGroup.length;
        console.error(`❌ Failed to sync ${companyName}:`, err.message);
        
        setSyncProgress(prev => {
          if (!prev) return null;
          const stat = prev.companyStats[companyName] || { 
            name: companyName, 
            uuid: '', 
            found: jobsInGroup.length, 
            synced: 0, 
            failed: jobsInGroup.length,
            lastError: err.message
          };
          stat.failed = jobsInGroup.length;
          stat.lastError = err.message;
          return { 
            ...prev, 
            processedCount: prev.processedCount + jobsInGroup.length, 
            errorCount: prev.errorCount + jobsInGroup.length,
            companyStats: { ...prev.companyStats, [companyName]: stat }
          };
        });
      }
    }

    // Final summary
    console.log(`\n🎯 Sync Summary:`);
    console.log(`   ✅ Jobs succeeded: ${jobsSucceeded}`);
    console.log(`   ❌ Jobs failed: ${jobsFailed}`);
    console.log(`   📝 Companies created: ${companiesCreated}`);
    console.log(`   ⚠️ Companies failed: ${companiesFailed.length}`);
    if (companiesFailed.length > 0) {
      console.log(`   Failed: ${companiesFailed.join(', ')}`);
    }

    setStatus(`Sync complete! ✅ ${jobsSucceeded} jobs synced, ❌ ${jobsFailed} failed`);
    setPushingAll(false);
    fetchSyncedLinks();
    if (activeTab === 'database') {
      setCurrentPage(0);
      fetchDbJobs(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">
              JOB<span className="text-indigo-600">CURATOR</span>
            </h1>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('discovery')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === 'discovery' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>HARVESTER</button>
              <button onClick={() => setActiveTab('database')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === 'database' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>DATABASE</button>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'discovery' && discoveredJobs.length > 0 && (
              <button onClick={pushToDatabase} disabled={pushingAll} className="bg-green-600 text-white px-6 py-2 rounded-xl text-[10px] font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100 uppercase">
                {pushingAll ? 'SYNCING DATA...' : `SYNC ${discoveredJobs.filter(j => j.apply_link && !syncedApplyLinks.has(j.apply_link)).length} ROLES`}
              </button>
            )}
            <button onClick={runMassiveHarvest} disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black hover:bg-black transition-all uppercase">
              {loading ? `HARVESTING ${progress}%` : 'RUN GLOBAL HARVEST'}
            </button>
          </div>
        </div>
        {loading && <div className="h-1 bg-indigo-50 w-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div></div>}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {syncProgress && (
          <div className="mb-12 bg-white border-4 border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-10 text-white">
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Data Ingestion Engine</h3>
              <p className="text-sm font-mono text-slate-400 mb-8">Processing: {syncProgress.currentCompany}</p>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-3xl border-2 border-slate-700">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Synced</p>
                  <p className="text-4xl font-black text-green-400">{syncProgress.successCount}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-3xl border-2 border-slate-700">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Errors</p>
                  <p className="text-4xl font-black text-red-400">{syncProgress.errorCount}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-3xl border-2 border-slate-700">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Progress</p>
                  <p className="text-4xl font-black text-white">{Math.round((syncProgress.processedCount / syncProgress.totalToSync) * 100)}%</p>
                </div>
              </div>
            </div>
            {!pushingAll && (
              <div className="p-6 bg-white border-t flex justify-end">
                <button onClick={() => setSyncProgress(null)} className="px-10 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">CLOSE MONITOR</button>
              </div>
            )}
          </div>
        )}

        {dbError && activeTab === 'database' && (
          <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black text-red-900 mb-2">Connection Error</h3>
            <p className="text-red-700 mb-6">{dbError}</p>
            <button 
              onClick={() => fetchDbJobs(0)} 
              className="bg-red-600 text-white px-8 py-3 rounded-xl text-xs font-black hover:bg-red-700 transition-all uppercase"
            >
              Retry Loading Jobs
            </button>
          </div>
        )}

        <div className="mb-8">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">{status}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {(activeTab === 'discovery' ? discoveredJobs : dbJobs).map((job, idx) => (
            <JobCard 
              key={`${idx}-${job.apply_link}`} 
              job={job} 
              isSynced={syncedApplyLinks.has(job.apply_link!)}
            />
          ))}
        </div>

        {activeTab === 'database' && hasMore && dbJobs.length > 0 && !loading && (
          <div className="mt-12 text-center">
            <button 
              onClick={loadMore}
              className="bg-indigo-600 text-white px-12 py-4 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all uppercase shadow-lg"
            >
              Load More Jobs
            </button>
          </div>
        )}

        {discoveredJobs.length === 0 && !loading && activeTab === 'discovery' && (
          <div className="py-48 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Engine Standby</h3>
            <p className="text-slate-400 mt-4 text-[10px] font-black uppercase tracking-widest">Launch harvest to scan 100+ companies across all sectors.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
