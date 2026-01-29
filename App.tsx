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

  useEffect(() => {
    fetchSyncedLinks();
    if (activeTab === 'database') fetchDbJobs();
  }, [activeTab]);

  const fetchSyncedLinks = async () => {
    try {
      const { data } = await supabase.from('jobs').select('apply_link');
      if (data) setSyncedApplyLinks(new Set(data.map(j => j.apply_link)));
    } catch (e) {}
  };

  const fetchDbJobs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('jobs').select('*, company:companies(*)').order('created_at', { ascending: false });
      if (data) setDbJobs(data as any[]);
    } catch (e) {}
    setLoading(false);
  };

  const mapToJobCategory = (rawDept: string | undefined, title: string | undefined): JobCategory => {
    const combined = `${rawDept || ''} ${title || ''}`.toLowerCase();
    
    // Sales detection
    if (combined.includes('sales') || combined.includes('account executive') || 
        combined.includes('business development') || combined.includes('revenue') ||
        combined.includes('account manager') || combined.includes('bd ')) {
      return 'sales';
    }
    
    // Marketing detection
    if (combined.includes('marketing') || combined.includes('brand') || 
        combined.includes('growth') || combined.includes('content') || 
        combined.includes('seo') || combined.includes('digital marketing') ||
        combined.includes('campaign') || combined.includes('social media')) {
      return 'marketing';
    }
    
    // Finance detection
    if (combined.includes('finance') || combined.includes('accounting') || 
        combined.includes('controller') || combined.includes('financial') || 
        combined.includes('treasurer') || combined.includes('audit') ||
        combined.includes('analyst') && combined.includes('financial')) {
      return 'finance';
    }
    
    // Legal detection
    if (combined.includes('legal') || combined.includes('attorney') || 
        combined.includes('counsel') || combined.includes('compliance') || 
        combined.includes('lawyer') || combined.includes('paralegal') ||
        combined.includes('regulatory')) {
      return 'legal';
    }
    
    // Research & Development
    if (combined.includes('research') || combined.includes('science') || 
        combined.includes('r&d') || combined.includes('algorithm') || 
        combined.includes('scientist') || combined.includes('lab')) {
      return 'research-development';
    }
    
    // Management
    if (combined.includes('manager') || combined.includes('lead') || 
        combined.includes('head') || combined.includes('director') || 
        combined.includes('ops') || combined.includes('management') || 
        combined.includes('executive') || combined.includes('vp') ||
        combined.includes('chief')) {
      return 'management';
    }
    
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
      const slug = AtsService.generateSlug(companyName);
      
      // First: Try exact slug match
      let { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      // Second: Try case-insensitive name match if slug didn't work
      if (!existing) {
        const { data: nameMatch } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', companyName)
          .maybeSingle();
        existing = nameMatch;
      }
      
      // Third: Try ATS identifier match if provided
      if (!existing && atsIdentifier && atsPlatform) {
        const { data: atsMatch } = await supabase
          .from('companies')
          .select('id')
          .eq('ats_platform', atsPlatform)
          .eq('ats_identifier', atsIdentifier)
          .maybeSingle();
        existing = atsMatch;
      }
      
      if (existing) {
        return { id: existing.id, wasCreated: false };
      }

      // Create new company with enhanced metadata
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

          return {
            ...norm,
            company: { name: company.name, slug: AtsService.generateSlug(company.name) } as any,
            category: mapToJobCategory(norm.category, norm.title),
            job_type: mapToJobType(norm.location_city, norm.title)
          };
        });

        allFound.push(...normalized);
        if (i % 3 === 0) setDiscoveredJobs([...allFound]);
      } catch (e) {
        console.error(`Harvest failure for ${company.name}`);
      }
    }

    setDiscoveredJobs(allFound);
    setLoading(false);
    setProgress(100);
    setStatus(`Harvest complete! Found ${allFound.length} roles.`);
  };

  const pushToDatabase = async () => {
    const unSynced = discoveredJobs.filter(j => j.apply_link && !syncedApplyLinks.has(j.apply_link));
    if (unSynced.length === 0) return;

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

    for (const companyName of Object.keys(groups)) {
      const jobsInGroup = groups[companyName];
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
          console.log(`📝 New company auto-created: ${companyName}`);
        }

        const payload = jobsInGroup.map(j => ({
          company_id: result.id!,
          title: j.title,
          category: j.category,
          location_city: j.location_city || 'Remote',
          location_country: j.location_country || 'Global',
          job_type: j.job_type,
          apply_link: j.apply_link,
          description: j.description || '',
          is_active: true
        }));

        const { error } = await supabase.from('jobs').upsert(payload, { onConflict: 'apply_link' });
        if (error) throw error;

        setSyncProgress(prev => {
          if (!prev) return null;
          const stat = prev.companyStats[companyName] || { 
            name: companyName, 
            uuid: result.id!, 
            found: jobsInGroup.length, 
            synced: 0, 
            failed: 0 
          };
          stat.synced += jobsInGroup.length;
          return {
            ...prev,
            processedCount: prev.processedCount + jobsInGroup.length,
            successCount: prev.successCount + jobsInGroup.length,
            companyStats: { ...prev.companyStats, [companyName]: stat }
          };
        });
      } catch (err: any) {
        companiesFailed.push(companyName);
        console.error(`❌ Failed to sync ${companyName}:`, err.message);
        
        setSyncProgress(prev => {
          if (!prev) return null;
          return { 
            ...prev, 
            processedCount: prev.processedCount + jobsInGroup.length, 
            errorCount: prev.errorCount + jobsInGroup.length 
          };
        });
      }
    }

    // Final summary
    console.log(`
      🎯 Sync Summary:
      - Companies auto-created: ${companiesCreated}
      - Companies failed: ${companiesFailed.length}
      ${companiesFailed.length > 0 ? `- Failed companies: ${companiesFailed.join(', ')}` : ''}
    `);

    setPushingAll(false);
    fetchSyncedLinks();
    if (activeTab === 'database') fetchDbJobs();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">
              TECH<span className="text-indigo-600">HARVESTER</span>
            </h1>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('discovery')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === 'discovery' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>HARVESTER</button>
              <button onClick={() => setActiveTab('database')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === 'database' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>DATABASE</button>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'discovery' && discoveredJobs.length > 0 && (
              <button onClick={pushToDatabase} disabled={pushingAll} className="bg-green-600 text-white px-6 py-2 rounded-xl text-[10px] font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100 uppercase">
                {pushingAll ? 'SYNCING DATA...' : `SYNC ${discoveredJobs.length} ROLES`}
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
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">Data Ingestion Engine</h3>
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

        {discoveredJobs.length === 0 && !loading && activeTab === 'discovery' && (
          <div className="py-48 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Engine Standby</h3>
            <p className="text-slate-400 mt-4 text-[10px] font-black uppercase tracking-widest">Launch harvest to scan 70+ tech giants.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
