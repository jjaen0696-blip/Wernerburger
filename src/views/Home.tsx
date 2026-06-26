import { useEffect, useState } from 'react';
import { ShoppingBag, Clock, Star, ArrowRight, LogIn, MapPin, ChevronDown, Check } from 'lucide-react';
import WernerLogo from '../components/WernerLogo';
import { supabase, type Location } from '../lib/supabase';

type Props = {
  onOrder: (locationId: string) => void;
  onKitchenAccess: () => void;
};

export default function Home({ onOrder, onKitchenAccess }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (data && data.length > 0) {
        setLocations(data);
        setSelectedLocation(data[0]);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#c8102e] text-white">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5 flex items-center justify-between">
        <WernerLogo size="md" />
        <button
          onClick={onKitchenAccess}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur border-2 border-yellow-400/40 text-white font-bold text-sm hover:bg-black/50 hover:border-yellow-400 transition-all"
        >
          <LogIn className="w-4 h-4 text-yellow-400" />
          Login
        </button>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Hamburguesa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#c8102e] via-[#c8102e]/85 to-[#c8102e]/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 mb-6">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-yellow-300">Comida hecha al momento</span>
            </div>
            <h1
              className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6 text-white"
              style={{
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
              }}
            >
              PIDE TU COMIDA
              <br />
              <span className="text-yellow-400">FAVORITA EN MINUTOS</span>
            </h1>
            <p className="text-lg text-white/80 mb-6 leading-relaxed max-w-lg font-medium">
              Hamburguesas, papas, bebidas y postres. Arma tu pedido y
              la cocina lo recibe al instante.
            </p>

            {/* Location selector */}
            <div className="mb-8 relative">
              <p className="text-sm font-bold text-white/60 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-yellow-400" />
                Elige tu sucursal
              </p>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between gap-3 w-full max-w-sm px-4 py-3 rounded-xl bg-black/30 backdrop-blur border-2 border-yellow-400/40 text-white font-bold hover:border-yellow-400 transition-all"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-yellow-400" />
                  {selectedLocation ? selectedLocation.name : 'Cargando...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-yellow-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full mt-2 w-full max-w-sm rounded-xl bg-stone-900 border-2 border-yellow-400/40 shadow-2xl overflow-hidden z-20">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setDropdownOpen(false);
                      }}
                      className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-white">{loc.name}</p>
                        <p className="text-xs text-white/50">{loc.address}</p>
                      </div>
                      {selectedLocation?.id === loc.id && (
                        <Check className="w-4 h-4 text-yellow-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => selectedLocation && onOrder(selectedLocation.id)}
                disabled={!selectedLocation}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-yellow-400 text-black font-black text-lg uppercase hover:bg-yellow-300 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/30 disabled:opacity-50 disabled:active:scale-100"
              >
                <ShoppingBag className="w-6 h-6" />
                Pedir ahora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-black py-20 px-6 border-t-4 border-yellow-400">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: ShoppingBag, title: 'Pide fácil', text: 'Explora el menú, agrega al carrito y confirma.' },
            { icon: Clock, title: 'En tiempo real', text: 'La cocina recibe tu pedido al instante.' },
            { icon: Star, title: 'Calidad garantizada', text: 'Ingredientes frescos preparados al momento.' },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-7 h-7 text-yellow-400" />
              </div>
              <h3
                className="text-lg font-black text-white mb-2 uppercase"
                style={{ fontFamily: "'Arial Black', sans-serif" }}
              >
                {f.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-black py-4 px-6 border-t border-yellow-400/20">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <p className="text-xs text-white/30">© WernerBurguer</p>
        </div>
      </footer>
    </div>
  );
}
