import { useEffect, useState } from 'react';
import { MapPin, ChevronDown, Check, Truck, Award, Heart, Flame, Lock } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: 'home' | 'menu') => void;
  onLogin?: () => void;
}

const BRANCHES = [
  { id: 'wb1', name: 'Werner Burger 1', address: 'Sucursal 1', is_closed: false },
  { id: 'wb2', name: 'Werner Burger 2', address: 'Sucursal 2', is_closed: false },
  { id: 'wb3', name: 'Werner Burger 3', address: 'Sucursal 3', is_closed: true },
  { id: 'wb4', name: 'Werner Burger 4', address: 'Sucursal 4', is_closed: false },
  { id: 'wb5', name: 'Werner Burger 5', address: 'Sucursal 5', is_closed: false },
  { id: 'wb6', name: 'Werner Burger 6', address: 'Sucursal 6', is_closed: false },
  { id: 'wb7', name: 'Werner Burger 7', address: 'Sucursal 7', is_closed: true },
];

type Branch = { id: string; name: string; address: string; is_closed?: boolean };

const API_BASE = import.meta.env.VITE_API_BASE || 'https://wernerburger.onrender.com';
const api = (path: string) => `${API_BASE}${path}`;

export default function Home({ onNavigate, onLogin }: HomeProps) {
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>(BRANCHES);
  const [selected, setSelected] = useState<Branch | null>(BRANCHES[0] || null);

  useEffect(() => {
    const storedBranchId = typeof window !== 'undefined' ? localStorage.getItem('werner-branch') : null;
    fetch(api('/branches'))
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load branches');
        return response.json();
      })
      .then((data: Branch[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data);
          const assigned = data.find((branch) => branch.id === storedBranchId);
          const firstOpen = data.find((branch) => !branch.is_closed);
          setSelected(assigned && !assigned.is_closed ? assigned : firstOpen || data[0] || null);
        }
      })
      .catch(() => {
        setBranches(BRANCHES);
        const assigned = BRANCHES.find((branch) => branch.id === storedBranchId);
        setSelected(assigned && !assigned.is_closed ? assigned : BRANCHES.find((branch) => !branch.is_closed) || BRANCHES[0] || null);
      });
  }, []);

  const handleSelect = (branch: Branch) => {
    if (branch.is_closed) return;
    setSelected(branch);
    setOpen(false);
  };

  const handleContinue = () => {
    if (selected && !selected.is_closed) onNavigate('menu');
  };

  return (
    <div className="bg-black">
      {/* HERO */}
      <section id="hero" className="relative min-h-[calc(100vh-1.5rem)] flex items-start overflow-hidden pb-8" style={{ paddingTop: 'env(safe-area-inset-top, 1.25rem)' }}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/werner-favicon.png"
            alt="Werner Burger logo"
            className="w-full h-full object-cover object-center scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        </div>

        {/* Content */}
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-16 w-full">
          <div className="max-w-2xl">
            <div className="flex flex-col items-start gap-3 mb-6">
              <div className="rounded-full border-4 border-amber-400/80 bg-black/70 p-1.5 shadow-[0_0_24px_rgba(245,158,11,0.35)] overflow-hidden">
                <img
                  src="/werner-favicon.png"
                  alt="Werner Burger logo"
                  className="h-24 w-24 sm:h-28 sm:w-28 object-cover"
                />
              </div>
              <span className="text-[1.6rem] sm:text-[2rem] font-black tracking-[0.25em] uppercase italic leading-none [text-shadow:0_0_22px_rgba(245,158,11,0.55)] drop-shadow-[0_2px_0_rgba(255,255,255,0.2)]">
                <span className="text-red-600">WERNER</span>
                <span className="text-white">BURGER</span>
              </span>
              <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-300/20 via-amber-300/10 to-amber-200/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-amber-100 shadow-[0_16px_45px_rgba(245,158,11,0.22)] backdrop-blur-md">
                <Flame className="h-4 w-4 text-amber-200" />
                <span className="font-semibold text-amber-100">COMIDA HECHA AL MOMENTO</span>
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 uppercase">
              PIDE TU <br />
              <span className="text-amber-400">COMIDA FAVORITA</span> <br />
              EN MINUTOS
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg leading-relaxed">
              Hamburguesas a la parrilla, hot dogs cargados, salchipapas y más. Una experiencia de pedido rápida, elegante y preparada para ti.
            </p>

            <div className="mb-8 flex flex-wrap gap-3">
              {['ENTREGA RÁPIDA', 'SABOR PREMIUM', 'PAGO SEGURO'].map(item => (
                <span key={item} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.25em] text-amber-100/90 backdrop-blur-sm">
                  {item}
                </span>
              ))}
            </div>

            {/* Branch selector */}
            <div className="max-w-md">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold tracking-[0.3em] text-amber-400 uppercase">
                    ELIGE TU SUCURSAL
                  </label>
                  <p className="text-sm text-gray-300">Selecciona una sucursal</p>
                </div>
                {onLogin && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="rounded-full border border-amber-300/40 bg-black/70 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-amber-200 transition hover:border-amber-400/60 hover:bg-amber-500/10"
                  >
                    Iniciar sesión
                  </button>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpen(o => !o)}
                  className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-3xl border bg-white/5 backdrop-blur-xl text-left transition-all duration-300 ${
                    open ? 'border-amber-400/40 bg-white/10 shadow-[0_18px_40px_rgba(245,158,11,0.16)]' : 'border-white/10 hover:border-amber-400/30 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                    {selected ? (
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{selected.name}</div>
                        <div className="text-gray-400 text-xs truncate">{selected.address}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Selecciona una sucursal...</span>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div
                      className="absolute z-50 mt-3 w-full rounded-[2rem] border border-amber-400/20 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl overflow-hidden"
                      style={{ backgroundImage: 'linear-gradient(135deg, rgba(15,15,15,0.96), rgba(35,18,4,0.92))' }}
                    >
                      <div className="max-h-[24rem] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#f59e0b_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-500/70 [&::-webkit-scrollbar-thumb:hover]:bg-amber-400 overflow-touch">
                        <div className="space-y-3 p-3">
                          {branches.map(branch => (
                            <button
                              key={branch.id}
                              disabled={branch.is_closed}
                              onClick={() => handleSelect(branch)}
                              className={`w-full flex items-center gap-3 rounded-[1.75rem] border px-4 py-4 text-left transition-all duration-300 ${
                                branch.is_closed
                                  ? 'border-rose-500/25 bg-rose-500/10 text-gray-300 opacity-80'
                                  : selected?.id === branch.id
                                    ? 'bg-amber-500/15 border-amber-400/30 text-white shadow-[0_12px_35px_rgba(245,158,11,0.18)]'
                                    : 'border-white/10 bg-white/5 text-gray-200 hover:border-amber-400/40 hover:bg-white/10'
                              }`}
                            >
                              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${branch.is_closed ? 'bg-rose-500/20' : selected?.id === branch.id ? 'bg-amber-400/20' : 'bg-white/10'}`}>
                                {branch.is_closed ? <Lock className="w-5 h-5 text-rose-300" /> : <MapPin className={`w-5 h-5 ${selected?.id === branch.id ? 'text-amber-300' : 'text-gray-300'}`} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-black uppercase tracking-[0.18em] text-white">
                                  {branch.name}
                                </div>
                                <div className={`text-[11px] ${selected?.id === branch.id ? 'text-amber-100/90' : 'text-gray-400'} truncate`}>{branch.address}</div>
                                {branch.is_closed && <div className="mt-1 inline-flex items-center rounded-full bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200">Cerrado por hoy</div>}
                              </div>
                              {!branch.is_closed && selected?.id === branch.id && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={handleContinue}
                  disabled={!selected || selected.is_closed}
                  className="w-full rounded-full bg-amber-500 px-7 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-stone-950 transition hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(245,158,11,0.25)]"
                >
                  PEDIR AHORA
                </button>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-amber-400/25 bg-gradient-to-r from-[#3f2306]/80 via-[#533112]/60 to-[#b68e34]/20 px-3 py-2 text-[10px] text-gray-100 shadow-[0_10px_30px_rgba(183,143,47,0.18)] backdrop-blur-sm">
              <div className="px-2 py-1 rounded-full bg-amber-300/10 text-amber-200 font-bold uppercase tracking-[0.25em]">15–20 MIN</div>
              <div className="text-[12px] leading-4 text-gray-200/90">
                Elige una <span className="font-semibold text-amber-200">sucursal abierta</span> para continuar.
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* FEATURES BAR */}
      <section
        className="border-t border-white/10 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.25)]"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgba(77,8,8,0.96) 0%, rgba(110,13,13,0.94) 50%, rgba(51,5,5,0.96) 100%)'
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Truck, title: 'Entrega rápida', desc: 'Llegamos en minutos' },
              { icon: Award, title: 'Sabor premium', desc: 'Ingredientes seleccionados' },
              { icon: Heart, title: 'Pago seguro', desc: 'Tu pedido protegido' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <f.icon className="h-5 w-5 text-amber-200" />
                </div>
                <div>
                  <div className="text-sm font-bold">{f.title}</div>
                  <div className="text-xs text-amber-100/80">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
