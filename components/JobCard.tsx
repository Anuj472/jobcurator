
import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Partial<Job>;
  isSynced?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, isSynced }) => {
  return (
    <div className={`bg-white rounded-[3rem] shadow-sm border p-10 transition-all flex flex-col h-full group ${isSynced ? 'border-indigo-100 bg-indigo-50/20 shadow-none' : 'border-slate-200 hover:shadow-2xl hover:border-indigo-300 hover:-translate-y-2'}`}>
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-6">
          <div className="w-20 h-20 shrink-0 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-3xl font-black text-white uppercase shadow-xl shadow-slate-200 overflow-hidden">
             {job.company?.slug ? (
               <img src={`https://logo.clearbit.com/${job.company.slug}.com`} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
             ) : (
               job.company?.name?.charAt(0) || 'J'
             )}
          </div>
          <div>
            <h3 className="font-black text-slate-900 leading-tight line-clamp-2 text-2xl group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">{job.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.25em]">{job.company?.name || 'Unknown Corp'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-12 mt-auto pt-8">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100/60 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {job.location_city || 'Remote'}
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">
          {job.job_type}
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 rounded-full text-[10px] font-black text-green-600 uppercase tracking-widest">
          {job.category}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => window.open(job.apply_link || '#', '_blank')}
          className={`w-full py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${isSynced ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-900 text-white border-slate-900 hover:bg-indigo-600 hover:border-indigo-600'}`}
        >
          {isSynced ? 'VIEW LIVE ROLE' : 'VIEW ON BOARD'}
        </button>
      </div>
      
      {isSynced && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Stored In DB</span>
        </div>
      )}
    </div>
  );
};
