import React from 'react';
import { Star, Plus } from 'lucide-react';
import { MenuItem } from '../data/menuData';

export default function ProductCardPremium({ item, onAdd, compact }: { item: MenuItem; onAdd: () => void; compact?: boolean }) {
  return (
    <article className="glass-card card-border-gold group p-0 transition-all duration-500 hover:-translate-y-3 hover:shadow-premium-lg">
      <div className="rounded-[1.25rem] overflow-hidden border-b border-white/6">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Removed legacy 'TODOS' badge and star per design request */}
        </div>

        <div className="p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-white font-black text-lg leading-tight line-clamp-1 group-hover:text-amber-200 transition-colors duration-300">{item.name}</h3>
            {/* Removed small 'TODOS' tag */}
          </div>

          <p className={`text-gray-400 text-sm mb-4 ${compact ? 'h-9' : 'h-12'} leading-relaxed group-hover:text-gray-300 transition-colors duration-300`}>{item.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="price-premium">${item.price.toFixed(2)}</span>
              {item.originalPrice && (
                <span className="text-gray-500 text-sm line-through group-hover:text-gray-600 transition-colors duration-300">${item.originalPrice.toFixed(2)}</span>
              )}
            </div>

            <button onClick={onAdd} className="btn-premium-sm flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
