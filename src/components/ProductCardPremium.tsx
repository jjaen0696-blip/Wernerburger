import React from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, Sparkles, BadgeCheck, TrendingUp } from 'lucide-react';
import { MenuItem } from '../data/menuData';

export default function ProductCardPremium({ item, onAdd, compact }: { item: MenuItem; onAdd: () => void; compact?: boolean }) {
  const badges = [
    item.isFeatured ? { label: 'Premium', icon: BadgeCheck } : null,
    item.isPopular ? { label: 'Top vendido', icon: TrendingUp } : null,
    !item.isPopular && !item.isFeatured ? { label: 'Nuevo', icon: Sparkles } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof Star }>;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-[0_24px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl"
    >
      <div className="relative overflow-hidden rounded-[2rem] border-b border-white/10">
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out"
            whileHover={{ scale: 1.05 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <span key={badge.label} className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100 shadow-[0_12px_24px_rgba(0,0,0,0.25)] backdrop-blur-md">
                  <Icon className="h-3.5 w-3.5 text-amber-300" />
                  {badge.label}
                </span>
              );
            })}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute right-4 bottom-4 rounded-full border border-amber-200/20 bg-amber-300/15 p-2 shadow-[0_14px_40px_rgba(245,158,11,0.2)]">
            <button onClick={onAdd} className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-black shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_56px_rgba(245,158,11,0.35)]">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black uppercase tracking-[0.04em] text-white transition-colors duration-300 group-hover:text-amber-100">{item.name}</h3>
          <span className="text-xs text-gray-400 uppercase tracking-[0.28em]">{item.category}</span>
        </div>

        <p className={`text-sm leading-6 ${compact ? 'text-gray-400 line-clamp-2' : 'text-gray-300'} transition-colors duration-300`}>{item.description}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Precio</p>
            <p className="price-premium mt-1">${item.price.toFixed(2)}</p>
          </div>
          <button onClick={onAdd} className="btn-premium-sm inline-flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
