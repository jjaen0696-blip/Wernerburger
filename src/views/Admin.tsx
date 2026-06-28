import { useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  Building2, Users, ChefHat, Home as HomeIcon, LogOut, Menu as MenuIcon, X,
  Shield, Store, ShieldAlert, Boxes, Truck, Send, ArrowLeftRight, LayoutDashboard, BarChart3, History, ShoppingCart, DollarSign,
} from 'lucide-react';
import { supabase, getCurrentProfile, type Profile } from '../lib/supabase';
import WernerLogo from '../components/WernerLogo';
import KitchenLock from './KitchenLock';
import { Spinner, Pill } from '../admin/ui';
import Sucursales from '../admin/Sucursales';
import Usuarios from '../admin/Usuarios';
import Dashboard from '../admin/Dashboard';
import InventarioCentral from '../admin/InventarioCentral';
import InventarioSucursal from '../admin/InventarioSucursal';
import Distribucion from '../admin/Distribucion';
import Transferencias from '../admin/Transferencias';
import Recetas from '../admin/Recetas';
import Reportes from '../admin/Reportes';
import Historial from '../admin/Historial';
import Proveedores from '../admin/Proveedores';
import VentasLocal from '../admin/VentasLocal';
import Ventas from '../admin/Ventas';

type Props = {
  onBack: () => void;       // volver al inicio (home)
  onGoKitchen: () => void;  // ir al panel de cocina
};

type Section = {
  key: string;
  label: string;
  icon: typeof Building2;
  adminOnly: boolean;
  render: (ctx: { profile: Profile }) => ReactNode;
};

// Secciones del panel. Se irán sumando en cada fase (distribución, transferencias, dashboard, etc.).
const SECTIONS: Section[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false, render: ({ profile }) => <Dashboard profile={profile} /> },
  { key: 'ventas-local', label: 'Ventas en local', icon: ShoppingCart, adminOnly: false, render: ({ profile }) => <VentasLocal profile={profile} /> },
  { key: 'central', label: 'Inventario central', icon: Boxes, adminOnly: true, render: () => <InventarioCentral /> },
  { key: 'sucursal-inv', label: 'Inventario sucursal', icon: Store, adminOnly: false, render: ({ profile }) => <InventarioSucursal profile={profile} /> },
  { key: 'distribucion', label: 'Distribución', icon: Send, adminOnly: true, render: () => <Distribucion /> },
  { key: 'transferencias', label: 'Transferencias', icon: ArrowLeftRight, adminOnly: false, render: ({ profile }) => <Transferencias profile={profile} /> },
  { key: 'recetas', label: 'Recetas', icon: ChefHat, adminOnly: true, render: () => <Recetas /> },
  { key: 'ventas', label: 'Ventas', icon: DollarSign, adminOnly: false, render: ({ profile }) => <Ventas profile={profile} /> },
  { key: 'reportes', label: 'Reportes', icon: BarChart3, adminOnly: false, render: ({ profile }) => <Reportes profile={profile} /> },
  { key: 'historial', label: 'Historial', icon: History, adminOnly: false, render: ({ profile }) => <Historial profile={profile} /> },
  { key: 'proveedores', label: 'Proveedores', icon: Truck, adminOnly: true, render: () => <Proveedores /> },
  { key: 'sucursales', label: 'Sucursales', icon: Building2, adminOnly: true, render: () => <Sucursales /> },
  { key: 'usuarios', label: 'Usuarios y roles', icon: Users, adminOnly: true, render: ({ profile }) => <Usuarios currentEmail={profile.email} /> },
];

export default function Admin({ onBack, onGoKitchen }: Props) {
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeKey, setActiveKey] = useState<string>('dashboard');
  const [navOpen, setNavOpen] = useState(false);

  const refresh = useCallback(async () => {
    setAuthLoading(true);
    const p = await getCurrentProfile();
    setProfile(p);
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => { sub.subscription.unsubscribe(); };
  }, [refresh]);

  if (authLoading) {
    return <div className="min-h-screen bg-premium"><Spinner label="Cargando panel…" /></div>;
  }

  // Sin sesión → reutilizamos la pantalla de acceso de cocina.
  if (!profile) {
    return <KitchenLock onUnlock={refresh} onBack={onBack} />;
  }

  const isAdmin = profile.role === 'admin';
  const visible = SECTIONS.filter((s) => !s.adminOnly || isAdmin);
  const active = visible.find((s) => s.key === activeKey) ?? visible[0];

  const NavList = () => (
    <nav className="space-y-1">
      {visible.map((s) => {
        const Icon = s.icon;
        const on = active?.key === s.key;
        return (
          <button
            key={s.key}
            onClick={() => { setActiveKey(s.key); setNavOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
              on ? 'bg-yellow-cta text-ink shadow-glow-gold' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {s.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-premium text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-strong border-b border-white/8">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => setNavOpen((v) => !v)} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 lg:hidden" aria-label="Menú">
            {navOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
          <WernerLogo size="md" />
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-7 w-px bg-white/10" />
            <span className="font-display text-sm font-extrabold uppercase tracking-tight text-white/80">Administración</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {profile.role === 'admin'
              ? <Pill tone="gold" className="hidden sm:inline-flex"><Shield className="h-3 w-3" /> Admin</Pill>
              : <Pill tone="green" className="hidden sm:inline-flex"><Store className="h-3 w-3" /> Encargado</Pill>}
            <button onClick={onGoKitchen} className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-bold text-white/80 transition-colors hover:border-gold/40 hover:text-gold sm:flex">
              <ChefHat className="h-4 w-4" /> Cocina
            </button>
            <button onClick={onBack} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition-colors hover:border-gold/40 hover:text-gold" aria-label="Inicio">
              <HomeIcon className="h-5 w-5" />
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); onBack(); }} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition-colors hover:bg-white/10" aria-label="Salir">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-[84px]">
            <NavList />
          </div>
        </aside>

        {/* Drawer (mobile) */}
        {navOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setNavOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-premium p-4 shadow-2xl animate-slide-in">
              <div className="mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-gold" />
                <span className="font-display font-extrabold text-white">Secciones</span>
              </div>
              <NavList />
              <div className="mt-4 border-t border-white/8 pt-4">
                <button onClick={() => { onGoKitchen(); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/[0.06]">
                  <ChefHat className="h-[18px] w-[18px]" /> Ir a Cocina
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 pb-20">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] py-20 text-center">
              <ShieldAlert className="h-10 w-10 text-gold/70" />
              <p className="font-display text-lg font-bold text-white">Sin secciones disponibles</p>
              <p className="max-w-sm text-sm text-white/45">Tu rol aún no tiene módulos asignados. El inventario de tu sucursal se habilitará en las próximas fases.</p>
            </div>
          ) : (
            <div key={active?.key} className="animate-fade-up">
              {active?.render({ profile })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
