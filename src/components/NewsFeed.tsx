import { Ad } from '../types';
import { Clock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface NewsFeedProps {
  ads: Ad[];
}

export const NewsFeed = ({ ads }: NewsFeedProps) => {
  const latestAds = ads.slice(0, 5);

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm sticky top-24">
      <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <h3 className="font-bold text-zinc-900 text-[10px] uppercase tracking-widest">Fil d'actualité</h3>
      </div>
      <div className="divide-y divide-zinc-100">
        {latestAds.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">Aucune activité récente.</div>
        ) : (
          latestAds.map((ad) => (
            <div key={ad.id} className="p-4 hover:bg-zinc-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                  {ad.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-emerald-600 transition-colors">{ad.title}</p>
                  <p className="text-[9px] text-zinc-500 truncate">{ad.author} à {ad.location}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-black text-emerald-600">{formatCurrency(ad.price)}</span>
                <span className="text-[8px] text-zinc-400 font-mono flex items-center gap-1">
                  <Clock size={8} />
                  {new Date(ad.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 bg-zinc-50 border-t border-zinc-100">
        <p className="text-[9px] text-zinc-400 text-center font-medium">Mise à jour en temps réel</p>
      </div>
    </div>
  );
};
