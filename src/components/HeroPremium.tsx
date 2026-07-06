import React from 'react';
import { Flame, Clock } from 'lucide-react';

export default function HeroPremium({ value, onChange }: { value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <header className="relative overflow-hidden py-20 sm:py-24 lg:py-28 min-h-[30rem] sm:min-h-[34rem] border-b border-amber-400/10 hero-premium">
      <div className="absolute inset-0">
        <img
          src="/WhatsApp%20Image%202026-07-05%20at%205.19.24%20PM.jpeg"
          alt="Fondo"
          className="w-full h-full object-cover scale-110"
          style={{ objectPosition: '82% 45%' }}
        />
        <div className="hero-ambient" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/25 to-orange-500/15 px-4 py-2.5 text-amber-200 text-xs font-bold tracking-[0.5em] uppercase backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:border-amber-400/70">
            <Flame className="w-4 h-4 animate-pulse" />
            Menú en vivo
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl border border-amber-300/25 bg-black/50 px-4 py-3 text-sm font-semibold text-amber-100 shadow-[0_12px_30px_rgba(245,158,11,0.18)] backdrop-blur-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300/15 text-amber-100">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Tiempo promedio</p>
              <p className="text-base font-bold text-white">15–20 min</p>
            </div>
          </div>
        </div>

        <h1 className="display-title font-black text-white mb-4 tracking-tight leading-[1.02]">Descubre nuestras delicias</h1>
        <p className="text-gray-350 max-w-2xl text-lg leading-relaxed font-light tracking-wide">Desde hot dogs hasta hamburguesas, salchipapas y arepas. Cada pedido se prepara con ingredientes frescos y listos en minutos.</p>

        <div className="relative mt-10 max-w-xl group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 to-orange-500/15 rounded-full blur-xl group-focus-within:blur-2xl transition-all duration-300 opacity-0 group-focus-within:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/8 to-orange-500/8 rounded-full blur-3xl transition-all duration-500" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-300/70 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <input
            type="text"
            value={value ?? ''}
            onChange={onChange}
            placeholder="Busca tu platillo favorito..."
            className="relative w-full pl-12 pr-5 py-3.5 rounded-full bg-white/8 border-2 border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/60 focus:bg-white/8 transition-all duration-300 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-amber-400/40 hover:bg-white/10"
          />
        </div>
      </div>

      <div aria-hidden className="pointer-events-none">
        <span className="particle absolute left-10 top-40 w-2 h-2 rounded-full bg-amber-300" style={{opacity:0.14}} />
        <span className="particle absolute left-48 top-28 w-1.5 h-1.5 rounded-full bg-amber-300" style={{opacity:0.12, animationDelay:'1.2s'}} />
        <span className="particle absolute right-40 top-32 w-2.5 h-2.5 rounded-full bg-amber-200" style={{opacity:0.1, animationDelay:'0.6s'}} />
      </div>
    </header>
  );
}
