import { useEffect, useState } from 'react';
import { ShoppingBag, Clock, Star, ArrowRight, LogIn, MapPin, ChevronDown, Check, Flame, Sparkles } from 'lucide-react';
import WernerLogo from '../components/WernerLogo';
import { supabase, type Location } from '../lib/supabase';

type Props = {
  onOrder: (locationId: string) => void;
  onKitchenAccess: () => void;
};

export default function Home({ onOrder, onKitchenAccess }: Props) {
  const defaultLocation: Location = {
    id: 'default',
    slug: 'default',
    name: 'WernerBurguer',
    address: 'Sucursal por defecto',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error: loadError } = await supabase
          .from('locations')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (loadError) {
          throw loadError;
        }

        if (data && data.length > 0) {
          setLocations(data);
          // No se pre-selecciona: el cliente debe elegir una sucursal a propósito.
        } else {
          setLocations([defaultLocation]);
          setSelectedLocation(defaultLocation);
          setWarning('No se encontraron sucursales activas. Usando sucursal por defecto.');
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo cargar las sucursales. Usando sucursal por defecto.';
        setLocations([defaultLocation]);
        setSelectedLocation(defaultLocation);
        setWarning(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-premium flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-gold border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-white/70 font-semibold">Cargando sucursales…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-premium flex items-center justify-center px-6">
        <div className="max-w-lg w-full glass-strong rounded-[28px] p-8 text-center shadow-card">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl mx-auto mb-5">😕</div>
          <p className="text-white font-display font-extrabold text-xl mb-3">Error al cargar sucursales</p>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              setLocations([]);
              setSelectedLocation(null);
              setDropdownOpen(false);
              const load = async () => {
                try {
                  const { data, error: loadError } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('is_active', true)
                    .order('name');

                  if (loadError) {
                    throw new Error(loadError.message);
                  }

                  if (data && data.length > 0) {
                    setLocations(data);
                    // No se pre-selecciona: el cliente debe elegir una sucursal.
                  } else {
                    setError('No se encontraron sucursales activas. Revisa la configuración de Supabase.');
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'No se pudo cargar las sucursales.');
                } finally {
                  setLoading(false);
                }
              };
              load();
            }}
            className="rounded-2xl bg-yellow-cta px-6 py-3 text-ink font-extrabold uppercase shadow-glow-gold transition-transform active:scale-95"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium text-white">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-5 sm:px-8 py-5 flex items-center justify-between">
        <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-3 py-2 border border-white/15">
          <WernerLogo size="md" />
        </div>
        <button
          onClick={onKitchenAccess}
          className="flex items-center gap-2 rounded-2xl border border-white/10 glass px-4 py-2.5 font-bold text-sm text-white/90 transition-all hover:border-gold/40 hover:text-white min-h-[44px]"
        >
          <LogIn className="h-4 w-4 text-gold" />
          Login
        </button>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/70 to-ink/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full pt-24 pb-12">
          <div className="max-w-2xl animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 mb-6">
              <Flame className="h-4 w-4 text-gold-light" />
              <span className="text-[13px] font-bold uppercase tracking-wider text-gold-light">Comida hecha al momento</span>
            </div>
            <h1 className="font-display text-[44px] sm:text-7xl font-extrabold leading-[0.95] tracking-tight mb-6 text-balance">
              PIDE TU COMIDA
              <br />
              <span className="text-gold-grad">FAVORITA EN MINUTOS</span>
            </h1>
            <p className="text-[15px] sm:text-lg text-white/60 mb-8 leading-relaxed max-w-lg">
              Hamburguesas a la parrilla, hot dogs cargados, salchipapas y más.
              Arma tu pedido y la cocina lo recibe al instante.
            </p>

            {/* Location selector */}
            <div className="mb-8 relative">
              <p className="text-[13px] font-bold uppercase tracking-wider text-white/45 mb-2 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold" />
                Elige tu sucursal
              </p>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between gap-3 w-full max-w-sm rounded-2xl border border-white/10 glass px-4 py-3.5 text-white font-semibold transition-all hover:border-gold/40 min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gold" />
                  <span className={selectedLocation ? '' : 'text-white/45'}>
                    {selectedLocation ? selectedLocation.name : 'Selecciona una sucursal'}
                  </span>
                </span>
                <ChevronDown className={`h-5 w-5 text-gold transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 max-w-sm rounded-2xl glass-strong shadow-card overflow-y-auto z-20 max-h-96 animate-scale-in">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setDropdownOpen(false);
                      }}
                      className="flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-white/[0.06] transition-colors min-h-[48px] border-b border-white/[0.06] last:border-b-0"
                    >
                      <div>
                        <p className="font-bold text-white">{loc.name}</p>
                        <p className="text-xs text-white/45">{loc.address}</p>
                      </div>
                      {selectedLocation?.id === loc.id && <Check className="h-5 w-5 text-gold" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {warning && (
              <div className="mb-5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-gold-light text-sm">
                {warning}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => selectedLocation && onOrder(selectedLocation.id)}
                disabled={!selectedLocation}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-yellow-cta px-8 py-4 text-ink font-extrabold text-lg uppercase tracking-wide shadow-glow-gold transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:active:scale-100 min-h-[52px]"
              >
                <ShoppingBag className="h-6 w-6" />
                Pedir ahora
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            {!selectedLocation && (
              <p className="mt-3 text-[13px] text-white/45 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold" />
                Elige una sucursal para continuar.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-white/8 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: ShoppingBag, title: 'Pide fácil', text: 'Explora el menú, agrega al carrito y confirma.' },
            { icon: Clock, title: 'En tiempo real', text: 'La cocina recibe tu pedido al instante.' },
            { icon: Star, title: 'Calidad garantizada', text: 'Ingredientes frescos preparados al momento.' },
          ].map((f) => (
            <div key={f.title} className="glass rounded-[24px] p-6 text-center transition-all hover:-translate-y-1.5 hover:border-gold/30">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-7 w-7 text-gold" />
              </div>
              <h3 className="font-display text-lg font-extrabold text-white mb-2 uppercase">{f.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/8 py-5 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold/50" />
          <p className="text-xs text-white/30">© WernerBurguer · Hecho al momento</p>
        </div>
      </footer>
    </div>
  );
}
