import { Ad } from '../types';
import { MapPin, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';

interface AdCardProps {
  ad: Ad;
  isAuthenticated: boolean;
  key?: any;
}

export const AdCard = ({ ad, isAuthenticated }: AdCardProps) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all group"
    >
      {ad.images && ad.images.length > 0 && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={ad.images[0]} 
            alt={ad.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold uppercase tracking-wider">
            <Tag size={12} />
            {ad.category}
          </div>
          <span className="text-lg font-bold text-emerald-600">{formatCurrency(ad.price)}</span>
        </div>
        
        <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">{ad.title}</h3>
        
        <div className="flex items-center gap-1 text-zinc-500 text-sm mb-4">
          <MapPin size={14} />
          {ad.location}
        </div>

        <div className="relative">
          <p className={cn(
            "text-zinc-600 text-sm leading-relaxed transition-all",
            !isAuthenticated && "line-clamp-3 blur-[1px] select-none opacity-40"
          )}>
            {ad.description}
          </p>
          {!isAuthenticated && (
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 bg-gradient-to-t from-white via-white/80 to-transparent">
              <span className="px-4 py-2 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-600/20 transform hover:scale-105 transition-transform cursor-pointer">
                Connectez-vous pour voir plus
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold text-xs">
            {ad.author.charAt(0)}
          </div>
          <span className="text-xs font-medium text-zinc-700">{ad.author}</span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">{new Date(ad.created_at).toLocaleDateString()}</span>
      </div>
    </motion.div>
  );
};
