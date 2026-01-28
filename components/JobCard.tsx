
import React, { useState } from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Partial<Job>;
  isSynced?: boolean;
  customJobType?: string;
}

export const JobCard: React.FC<JobCardProps> = ({ job, isSynced, customJobType }) => {
  const [copied, setCopied] = useState(false);

  const copySql = () => {
    const safeTitle = job.title?.replace(/'/g, "''") || 'Untitled Role';
    const safeLocCity = job.location_city?.replace(/'/g, "''") || 'Remote';
    const safeLink = job.apply_link || '';
    const safeDesc = job.description?.replace(/'/g, "''") || '';
    const safeCompId = job.company_id || 'COMPANY_UUID_HERE'; 

    const sql = `INSERT INTO public.jobs (
  company_id, title, location_city, job_type, apply_link, description, is_active
) VALUES (
  '${safeCompId}', 
  '${safeTitle}', 
  '${safeLocCity}', 
  '${customJobType || 'Full Time'}', 
  '${safeLink}', 
  '${safeDesc.substring(0, 100)}...', 
  true
) ON CONFLICT (apply_link) DO NOTHING;`;
    
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-[2rem] shadow-sm border p-6 transition-all flex flex-col h-full group ${isSynced ? 'border-blue-100 bg-blue-50/20 shadow-none' : 'border-slate-200 hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-900 flex items-center justify-center text-xl font-black text-white uppercase shadow-lg shadow-slate-200">
             {job.company?.name?.charAt(0) || 'J'}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 leading-tight line-clamp-2 text-lg group-hover:text-blue-600 transition-colors">{job.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">{job.company?.name || 'Company'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 mt-auto pt-4">
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100/50 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tighter">
          {job.location_city || 'Remote'}
        </div>
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-tighter">
          {customJobType || 'Full Time'}
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={copySql}
          className={`flex-1 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 border ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-900 text-white border-slate-900 hover:bg-blue-600'}`}
        >
          {copied ? 'SQL Template Copied' : 'Copy Manual SQL'}
        </button>

        <button 
          onClick={() => window.open(job.apply_link || '#', '_blank')}
          className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </button>
      </div>
      
      {isSynced && (
        <div className="mt-4 text-center">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            In Inventory
          </span>
        </div>
      )}
    </div>
  );
};
