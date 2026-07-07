import type { ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Sparkles, Star } from 'lucide-react';

export default function HeroPremium({ value, onChange }: { value?: string; onChange?: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24 min-h-[55vh] sm:min-h-[60vh] lg:min-h-[65vh] hero-premium"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_32%),radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.08),_transparent_22%),linear-gradient(180deg,_rgba(12,12,12,0.95),_rgba(4,4,4,0.8))]" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/45 to-transparent" />
        <div className="hero-ambient" />
        <div className="hero-smoke" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-amber-400/20 bg-black/40 px-4 py-2 text-sm uppercase tracking-[0.35em] text-amber-100 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <span className="inline-flex items-center gap-2 text-amber-200">
              <Flame className="h-4 w-4 animate-pulse" /> Más vendido
            </span>
            <span className="inline-flex items-center gap-2 text-amber-200">
              <Star className="h-4 w-4" /> Calidad Premium
            </span>
            <span className="inline-flex items-center gap-2 text-amber-200">
              <Sparkles className="h-4 w-4" /> Entrega rápida
            </span>
          </div>

          <div className="inline-flex items-center gap-3 rounded-[2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-amber-100 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300/15 text-amber-100">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.36em] text-amber-300/70">Tiempo promedio</p>
              <p className="text-base font-black text-white">20–35 minutos</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-4xl"
        >
          <h1 className="display-title text-white mb-5 max-w-3xl">Experiencia gourmet en cada pedido.</h1>
          <p className="text-gray-300 max-w-2xl text-lg leading-relaxed tracking-[0.02em]">Explora un menú de alto nivel con sabores intensos, presentaciones sofisticadas y combinaciones exclusivas pensadas para los paladares más exigentes.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mt-12 max-w-3xl"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 via-transparent to-orange-500/15 blur-3xl opacity-80" />
          <div className="relative rounded-full border border-white/10 bg-black/40 shadow-[0_32px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-300/15 text-amber-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 12v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" /></svg>
              </span>
            </div>
            <input
              type="text"
              value={value ?? ''}
              onChange={onChange}
              placeholder="Buscar platillos premium..."
              className="relative w-full rounded-full border border-white/15 bg-transparent py-4 pl-16 pr-5 text-white placeholder-gray-400 outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
