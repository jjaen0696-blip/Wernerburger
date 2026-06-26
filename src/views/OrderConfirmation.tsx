import { CheckCircle2, ArrowLeft, ShoppingBag, Clock } from 'lucide-react';

type Props = {
  orderNumber: number;
  onBackHome: () => void;
  onOrderAgain: () => void;
};

export default function OrderConfirmation({ orderNumber, onBackHome, onOrderAgain }: Props) {
  return (
    <div className="min-h-screen bg-premium flex items-center justify-center px-4 sm:px-6 py-10 text-white">
      <div className="max-w-md w-full text-center animate-fade-up">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/image.png"
            alt="WernerBurguer logo"
            className="w-20 h-20 rounded-full border-2 border-gold/60 object-cover shadow-glow-gold"
          />
        </div>

        {/* Check con halo */}
        <div className="relative mx-auto mb-7 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl" />
          <div className="relative w-24 h-24 rounded-full bg-yellow-cta flex items-center justify-center mx-auto animate-bounce-in shadow-glow-gold">
            <CheckCircle2 className="w-14 h-14 text-ink" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight mb-3">
          ¡Pedido <span className="text-gold-grad">enviado!</span>
        </h1>
        <p className="text-white/60 mb-7 leading-relaxed">
          Tu pedido ha sido recibido por la cocina. Puedes seguir su estado
          desde el panel de cocina.
        </p>

        {/* Número de pedido */}
        <div className="glass-strong rounded-[28px] p-7 mb-8 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Número de pedido</p>
          <p className="font-display text-6xl font-extrabold text-gold-grad leading-none">
            #{String(orderNumber).padStart(3, '0')}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium text-white/55">
            <Clock className="h-3.5 w-3.5 text-gold" />
            En preparación · listo en minutos
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onOrderAgain}
            className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-cta py-4 text-ink font-extrabold uppercase tracking-wide shadow-glow-gold transition-all hover:brightness-105 active:scale-95 min-h-[50px]"
          >
            <ShoppingBag className="h-5 w-5" />
            Hacer otro pedido
          </button>
          <button
            onClick={onBackHome}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-4 text-white/80 font-bold transition-colors hover:bg-white/10 min-h-[50px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
