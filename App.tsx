
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Job, Company, AtsPlatform } from './types';
import { JobCard } from './components/JobCard';
import { AtsService } from './services/atsService';

type EnumFormat = 'space' | 'underscore' | 'hyphen' | 'title-hyphen' | 'none' | 'custom';

interface CompanySyncStatus {
  name: string;
  found: number;
  synced: number;
  failed: number;
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
  
  // Sync Configuration
  const [enumFormat, setEnumFormat] = useState<EnumFormat>('space'); 
  const [customEnumVal, setCustomEnumVal] = useState('Full Time');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    detectSchemaFormat();
    fetchSyncedLinks();
    if (activeTab === 'database') fetchDbJobs();
  }, [activeTab]);

  const detectSchemaFormat = async () => {
    try {
      const { data } = await supabase.from('jobs').select('job_type').limit(1).single();
      if (data?.job_type) {
        const val = data.job_type;
        if (val.includes(' ')) setEnumFormat('space');
        else if (val.includes('_')) setEnumFormat('underscore');
        else if (val.includes('-')) {
            if (val.includes('F')) setEnumFormat('title-hyphen');
            else setEnumFormat('hyphen');
        }
        else setEnumFormat('none');
      }
    } catch (e) {}
  };

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

  const getTargetJobType = (original: string | undefined): string => {
    if (enumFormat === 'custom') return customEnumVal;
    if (!original) return 'Full Time';
    const clean = original.toLowerCase();
    let base = 'full time';
    if (clean.includes('part')) base = 'part time';
    if (clean.includes('contract')) base = 'contract';
    if (clean.includes('intern')) base = 'internship';

    switch (enumFormat) {
      case 'space': return base.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); 
      case 'underscore': return base.replace(' ', '_'); 
      case 'hyphen': return base.replace(' ', '-'); 
      case 'title-hyphen': return base.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-'); 
      case 'none': return base.replace(' ', ''); 
      default: return 'Full Time';
    }
  };

  const getOrCreateCompanyId = async (companyName: string, identifier: string, platform: AtsPlatform): Promise<string | null> => {
    const slug = AtsService.generateSlug(companyName);
    
    // 1. Prioritize looking up existing Palantir/etc UUIDs
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .or(`slug.eq.${slug},name.eq.${companyName}`)
      .maybeSingle();

    if (existing) return existing.id;

    // 2. Only create if it doesn't exist
    const { data: created, error } = await supabase
      .from('companies')
      .insert({ name: companyName, slug, ats_identifier: identifier, ats_platform: platform, active: true })
      .select('id')
      .single();

    return created?.id || null;
  };

  const pushAllToDatabase = async () => {
    const unSynced = discoveredJobs.filter(j => j.apply_link && !syncedApplyLinks.has(j.apply_link));
    if (unSynced.length === 0) return;

    setPushingAll(true);
    setSyncProgress({
      currentCompany: 'Starting...',
      processedCount: 0,
      totalToSync: unSynced.length,
      successCount: 0,
      errorCount: 0,
      companyStats: {}
    });

    const companyGroups = unSynced.reduce((acc, job) => {
      const cName = job.company?.name || 'Unknown';
      if (!acc[cName]) acc[cName] = [];
      acc[cName].push(job);
      return acc;
    }, {} as Record<string, Partial<Job>[]>);

    const companies = Object.keys(companyGroups);

    for (const cName of companies) {
      const jobs = companyGroups[cName];
      setSyncProgress(prev => prev ? { ...prev, currentCompany: cName } : null);

      try {
        const companyId = await getOrCreateCompanyId(
          cName, 
          jobs[0].company?.ats_identifier || AtsService.generateSlug(cName),
          jobs[0].company?.ats_platform || AtsPlatform.GREENHOUSE
        );

        if (companyId) {
          // Payload cleaned of external_id to avoid schema cache errors
          const payload = jobs.map(j => ({
            company_id: companyId,
            title: j.title,
            location_city: j.location_city,
            job_type: getTargetJobType(j.job_type),
            apply_link: j.apply_link,
            description: j.description || '',
            is_active: true
          }));

          const { error } = await supabase.from('jobs').upsert(payload, { onConflict: 'apply_link' });
          
          if (error) throw error;

          setSyncProgress(prev => {
            if (!prev) return null;
            const stats = { ...(prev.companyStats[cName] || { name: cName, found: 0, synced: 0, failed: 0 }) };
            stats.found += jobs.length;
            stats.synced += jobs.length;
            return {
              ...prev,
              processedCount: prev.processedCount + jobs.length,
              successCount: prev.successCount + jobs.length,
              companyStats: { ...prev.companyStats, [cName]: stats }
            };
          });
        }
      } catch (err: any) {
        setSyncProgress(prev => {
          if (!prev) return null;
          const stats = { ...(prev.companyStats[cName] || { name: cName, found: 0, synced: 0, failed: 0 }) };
          stats.found += jobs.length;
          stats.failed += jobs.length;
          return {
            ...prev,
            processedCount: prev.processedCount + jobs.length,
            errorCount: prev.errorCount + jobs.length,
            companyStats: { ...prev.companyStats, [cName]: stats }
          };
        });
      }
    }

    setPushingAll(false);
    fetchSyncedLinks();
    if (activeTab === 'database') fetchDbJobs();
    setStatus("Sync completed. Schema errors bypassed.");
  };

  const runSmartDiscovery = async () => {
    setLoading(true);
    setStatus('🔍 Scanning global boards...');
    setProgress(5);
    setDiscoveredJobs([]);
    
    try {
      const targetUrl = 'https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/.github/scripts/listings.json';
      const rawListings = await AtsService.safeFetch(targetUrl);
      if (!rawListings) throw new Error('Network failure.');
      
      const companyMap = new Map();
      rawListings.forEach((job: any) => {
        let platform: AtsPlatform | null = null;
        let identifier = '';
        if (job.url?.includes('boards.greenhouse.io')) {
            platform = AtsPlatform.GREENHOUSE;
            const match = job.url.match(/boards\.greenhouse\.io\/([^/?#]+)/);
            if (match) identifier = match[1];
        } else if (job.url?.includes('jobs.lever.co')) {
            platform = AtsPlatform.LEVER;
            const match = job.url.match(/jobs\.lever\.co\/([^/?#]+)/);
            if (match) identifier = match[1];
        }
        if (platform && identifier && !companyMap.has(job.company_name)) {
          companyMap.set(job.company_name, { name: job.company_name, identifier, platform });
        }
      });

      const autoCompanies = Array.from(companyMap.values()).slice(0, 50); 
      let allFound: Partial<Job>[] = [];
      for (let i = 0; i < autoCompanies.length; i++) {
        const item = autoCompanies[i];
        setProgress(Math.round(5 + ((i + 1) / autoCompanies.length) * 95));
        try {
          let raw: any[] = [];
          if (item.platform === AtsPlatform.GREENHOUSE) raw = await AtsService.fetchGreenhouseJobs(item.identifier);
          else if (item.platform === AtsPlatform.LEVER) raw = await AtsService.fetchLeverJobs(item.identifier);
          allFound.push(...raw.map(j => ({ 
            ...(item.platform === AtsPlatform.GREENHOUSE ? AtsService.normalizeGreenhouse(j, '') : AtsService.normalizeLever(j, '')),
            company: { id: '', ...item, active: true, slug: AtsService.generateSlug(item.name) } 
          } as Partial<Job>)));
        } catch (e) {}
        if (i % 5 === 0) setDiscoveredJobs([...allFound]);
      }
      setDiscoveredJobs(allFound);
    } catch (e: any) {} finally {
      setLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-mono">JC</div>
              Job<span className="text-blue-600">Curator</span>
            </h1>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('discovery')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'discovery' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Discovery</button>
              <button onClick={() => setActiveTab('database')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'database' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Inventory</button>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {activeTab === 'discovery' && discoveredJobs.length > 0 && (
              <button onClick={pushAllToDatabase} disabled={pushingAll} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100">
                {pushingAll ? 'Processing...' : `Sync All (${discoveredJobs.length})`}
              </button>
            )}
            <button onClick={runSmartDiscovery} disabled={loading} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 transition-all">Scan Boards</button>
          </div>
        </div>
        {(loading || pushingAll) && <div className="h-0.5 bg-blue-100 w-full"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div></div>}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {syncProgress && (
          <div className="mb-8 bg-white border-2 border-slate-900 rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">Live Database Push</h3>
                <p className="text-slate-400 text-xs font-mono">Syncing: {syncProgress.currentCompany}</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-blue-400">{Math.round((syncProgress.processedCount / syncProgress.totalToSync) * 100)}%</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400">Successfully Added</p>
                  <p className="text-2xl font-black text-green-600">{syncProgress.successCount}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400">Failed / Schema Error</p>
                  <p className="text-2xl font-black text-red-600">{syncProgress.errorCount}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400">Total Discovery</p>
                  <p className="text-2xl font-black text-slate-900">{syncProgress.totalToSync}</p>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-3 font-black text-slate-400 uppercase text-[10px]">Company</th>
                      <th className="p-3 font-black text-slate-400 uppercase text-[10px]">Found</th>
                      <th className="p-3 font-black text-slate-400 uppercase text-[10px]">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {Object.values(syncProgress.companyStats).reverse().map(stat => (
                      <tr key={stat.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{stat.name}</td>
                        <td className="p-3 font-mono text-slate-500">{stat.found}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${stat.failed > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                            {stat.failed > 0 ? `Error (${stat.failed})` : 'Synced OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-slate-50 p-4 flex justify-end">
               <button onClick={() => setSyncProgress(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase">Dismiss Stats</button>
            </div>
          </div>
        )}

        <div className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              {activeTab === 'discovery' ? 'Global Scan' : 'Job Inventory'}
            </h2>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {status || 'Ready for Scan'}
              </div>
              {discoveredJobs.length > 0 && activeTab === 'discovery' && (
                <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                  {discoveredJobs.length} Results Found
                </div>
              )}
            </div>
          </div>
        </div>

        {discoveredJobs.length === 0 && activeTab === 'discovery' && !loading && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Discovery Ready</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Click "Scan Boards" to begin real-time job harvesting.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'discovery' ? discoveredJobs : dbJobs).map((job, idx) => (
            <JobCard 
              key={`${idx}-${job.apply_link}`} 
              job={job} 
              isSynced={syncedApplyLinks.has(job.apply_link!)}
              customJobType={getTargetJobType(job.job_type)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
