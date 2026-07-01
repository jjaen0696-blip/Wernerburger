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

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('[data-location-dropdown]')) return;
      setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

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
      <nav className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
          <WernerLogo size="md" />
        </div>
        <button
          onClick={onKitchenAccess}
          className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/10 glass px-4 py-2.5 text-sm font-bold text-white/90 transition-all hover:border-gold/40 hover:text-white"
        >
          <LogIn className="h-4 w-4 text-gold" />
          Login
        </button>
      </nav>

      {/* Hero */}
      <section className="relative isolate overflow-visible">
        <div className="absolute inset-0 bg-[#5e0a0c]">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat blur-3xl opacity-60 saturate-150"
            style={{ backgroundImage: "url('/werner-banner.png')" }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/werner-banner.png')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/50 to-ink/20" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl items-center px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl animate-fade-up">
            <img
              src="/werner-chef.png"
              alt="Werner Burger"
              className="mb-6 h-24 w-24 rounded-full border-2 border-gold/50 object-cover shadow-glow-gold sm:h-28 sm:w-28"
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5">
              <Flame className="h-4 w-4 text-gold-light" />
              <span className="text-[13px] font-bold uppercase tracking-wider text-gold-light">Comida hecha al momento</span>
            </div>
            <h1 className="mb-6 max-w-2xl font-display text-[40px] font-extrabold leading-[0.95] tracking-tight text-balance text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.75)] sm:text-6xl lg:text-7xl">
              PIDE TU COMIDA
              <br />
              <span className="text-gold-grad">FAVORITA EN MINUTOS</span>
            </h1>
            <p className="mb-8 max-w-lg text-[15px] leading-relaxed text-white/75 [text-shadow:0_1px_10px_rgba(0,0,0,0.8)] sm:text-lg">
              Hamburguesas a la parrilla, hot dogs cargados, salchipapas y más.
              Arma tu pedido y la cocina lo recibe al instante.
            </p>

            {/* Location selector */}
            <div className="relative mb-14 w-full max-w-sm sm:mb-16">
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-white/45">
                <MapPin className="h-4 w-4 text-gold" />
                Elige tu sucursal
              </p>
              <button
                id="branch-selector-trigger"
                onClick={() => {
                  setDropdownOpen((prev) => !prev);
                }}
                className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#120e0f]/70 px-4 py-3.5 text-left font-semibold text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-all hover:border-gold/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MapPin className="h-5 w-5 shrink-0 text-gold" />
                  <span className={`truncate ${selectedLocation ? '' : 'text-white/45'}`}>
                    {selectedLocation ? selectedLocation.name : 'Selecciona una sucursal'}
                  </span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-gold transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div
                  data-location-dropdown
                  className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-[20px] border border-white/10 bg-[#0b0809] shadow-[0_16px_42px_rgba(0,0,0,0.72)]"
                >
                  <div className="max-h-[min(320px,72svh)] overflow-y-auto overscroll-contain bg-[#0b0809]">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setDropdownOpen(false);
                        }}
                        className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.08]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">{loc.name}</p>
                          <p className="truncate text-xs text-white/45">{loc.address}</p>
                        </div>
                        {selectedLocation?.id === loc.id && <Check className="h-5 w-5 shrink-0 text-gold" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {warning && (
              <div className="mb-5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-light">
                {warning}
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => selectedLocation && onOrder(selectedLocation.id)}
                disabled={!selectedLocation}
                className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-2xl bg-yellow-cta px-8 py-4 text-lg font-extrabold uppercase tracking-wide text-ink shadow-glow-gold transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:active:scale-100 sm:w-auto"
              >
                <ShoppingBag className="h-6 w-6" />
                Pedir ahora
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            {!selectedLocation && (
              <p className="mt-3 flex items-center gap-1.5 text-[13px] text-white/45">
                <MapPin className="h-4 w-4 text-gold" />
                Elige una sucursal para continuar.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-white/8 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
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

      <footer className="border-t border-white/8 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold/50" />
          <p className="text-xs text-white/30">© WernerBurguer · Hecho al momento</p>
        </div>
      </footer>
    </div>
  );
}
