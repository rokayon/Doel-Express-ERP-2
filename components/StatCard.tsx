
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between transition-all hover:shadow-xl hover:translate-y-[-2px] active:scale-[0.98] group">
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-xs font-black uppercase tracking-widest truncate mb-1">{title}</p>
        <h3 className="text-lg sm:text-2xl font-black dark:text-white truncate leading-none mb-2">{value}</h3>
        {trend && (
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
            <i className={`fa-solid ${trend.startsWith('+') ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl ${color} bg-opacity-10 ${color.replace('bg-', 'text-')} dark:bg-opacity-20 flex items-center justify-center text-lg sm:text-2xl shadow-sm transition-transform group-hover:scale-110 flex-shrink-0 ml-4`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;