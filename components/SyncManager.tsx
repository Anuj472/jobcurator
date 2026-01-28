
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AtsService } from '../services/atsService';
import { Company, AtsPlatform, SyncStats } from '../types';
import { INITIAL_COMPANIES } from '../constants';

export const SyncManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [statusText, setStatusText] = useState('');
  const [syncedLinks, setSyncedLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCompanies();
    fetchSyncedLinks();
  }, []);

  const fetchSyncedLinks = async () => {
    const { data } = await supabase.from('jobs').select('apply_link');
    if (data) setSyncedLinks(new Set(data.map(j => j.apply_link)));
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) console.error(error);
    else setCompanies(data || []);
  };

  const seedCompanies = async () => {
    setStatusText('Seeding companies...');
    for (const item of INITIAL_COMPANIES) {
      const { error } = await supabase.from('companies').upsert({
        name: item.name,
        ats_identifier: item.identifier,
        ats_platform: item.platform,
        active: true
      }, { onConflict: 'ats_identifier' });
      if (error) console.error(`Error seeding ${item.name}:`, error);
    }
    await fetchCompanies();
    setStatusText('Companies seeded successfully.');
  };

  const syncAll = async () => {
    if (companies.length === 0) {
      alert('Seed companies first!');
      return;
    }

    setIsSyncing(true);
    setStats({ found: 0, added: 0, updated: 0, failed: 0 });
    setStatusText('Starting sync process...');

    await fetchSyncedLinks();

    for (const company of companies) {
      if (!company.active) continue;

      setStatusText(`Syncing ${company.name}...`);
      let rawJobs: any[] = [];
      try {
        switch (company.ats_platform) {
          case AtsPlatform.GREENHOUSE:
            rawJobs = await AtsService.fetchGreenhouseJobs(company.ats_identifier);
            break;
          case AtsPlatform.LEVER:
            rawJobs = await AtsService.fetchLeverJobs(company.ats_identifier);
            break;
          case AtsPlatform.ASHBY:
            rawJobs = await AtsService.fetchAshbyJobs(company.ats_identifier);
            break;
        }

        const normalizedJobs = rawJobs.map(raw => {
          let job: any;
          if (company.ats_platform === AtsPlatform.GREENHOUSE) job = AtsService.normalizeGreenhouse(raw, company.id);
          else if (company.ats_platform === AtsPlatform.LEVER) job = AtsService.normalizeLever(raw, company.id);
          else if (company.ats_platform === AtsPlatform.ASHBY) job = AtsService.normalizeAshby(raw, company.id);

          job.job_type = job.job_type || 'full_time';
          job.slug = AtsService.generateSlug(`${company.name} ${job.title} ${job.external_id}`);
          return job;
        });

        const newJobs = normalizedJobs.filter(j => j.apply_link && !syncedLinks.has(j.apply_link));

        if (newJobs.length > 0) {
          const { error } = await supabase.from('jobs').insert(newJobs);
          if (error) {
            console.error('Job insert error:', error);
            setStats(prev => ({ ...prev!, failed: prev!.failed + newJobs.length }));
          } else {
            setStats(prev => ({ ...prev!, added: prev!.added + newJobs.length }));
            newJobs.forEach(j => syncedLinks.add(j.apply_link));
          }
        }

        await supabase.from('companies').update({ last_sync_at: new Date().toISOString() }).eq('id', company.id);

      } catch (err) {
        console.error(`Failed sync for ${company.name}`, err);
        setStats(prev => ({ ...prev!, failed: prev!.failed + 1 }));
      }
    }

    setIsSyncing(false);
    setStatusText('Sync complete!');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Database Sync Control</h2>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={seedCompanies} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors">1. Seed Companies</button>
        <button onClick={syncAll} disabled={isSyncing} className={`flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {isSyncing && <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
          2. Run Aggregation Sync
        </button>
      </div>

      {statusText && <div className="p-4 bg-slate-50 rounded-lg text-slate-600 mb-4 border border-slate-100 flex items-center gap-3"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>{statusText}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100"><p className="text-sm text-green-600 font-medium">Synced</p><p className="text-2xl font-bold text-green-700">{stats.added}</p></div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100"><p className="text-sm text-red-600 font-medium">Errors</p><p className="text-2xl font-bold text-red-700">{stats.failed}</p></div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100"><p className="text-sm text-blue-600 font-medium">Companies</p><p className="text-2xl font-bold text-blue-700">{companies.length}</p></div>
        </div>
      )}
    </div>
  );
};
