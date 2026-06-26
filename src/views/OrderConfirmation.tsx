import { CheckCircle2, ArrowLeft, ShoppingBag } from 'lucide-react';
import WernerLogo from '../components/WernerLogo';

type Props = {
  orderNumber: number;
  onBackHome: () => void;
  onOrderAgain: () => void;
};

export default function OrderConfirmation({ orderNumber, onBackHome, onOrderAgain }: Props) {
  return (
    <div className="min-h-screen bg-[#c8102e] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <WernerLogo size="lg" />
        </div>
        <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-yellow-400 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
          <CheckCircle2 className="w-14 h-14 sm:w-11 sm:h-11 text-black" />
        </div>
        <h1
          className="text-4xl sm:text-3xl font-black text-white mb-3 uppercase"
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            textShadow: '2px 2px 0 #000',
          }}
        >
          ¡Pedido enviado!
        </h1>
        <p className="text-base sm:text-base text-white/80 mb-6 leading-relaxed">
          Tu pedido ha sido recibido por la cocina. Puedes seguir su estado
          desde el panel de cocina.
        </p>
        <div className="bg-black/20 rounded-2xl border-2 border-yellow-400/40 p-6 sm:p-5 mb-8">
          <p className="text-base sm:text-sm text-white/60 mb-2 sm:mb-1">Número de pedido</p>
          <p
            className="text-5xl sm:text-4xl font-black text-yellow-400"
            style={{ fontFamily: "'Arial Black', sans-serif" }}
          >
            #{String(orderNumber).padStart(3, '0')}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onOrderAgain}
            className="flex items-center justify-center gap-2 py-4 rounded-xl bg-yellow-400 text-black font-black uppercase hover:bg-yellow-300 transition-all active:scale-95 text-base min-h-[48px]"
          >
            <ShoppingBag className="w-6 h-6 sm:w-5 sm:h-5" />
            Hacer otro pedido
          </button>
          <button
            onClick={onBackHome}
            className="flex items-center justify-center gap-2 py-4 rounded-xl bg-black/30 border-2 border-yellow-400/40 text-white font-bold hover:bg-black/50 transition-all text-base min-h-[48px]"
          >
            <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
