import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2, PackageSearch, X } from 'lucide-react';
import Home from './views/Home';
import { supabase, type OrderType } from './lib/supabase';

// Code-splitting: la app del cliente sólo carga Home al inicio.
// El menú, la cocina y el panel de inventario se cargan bajo demanda.
const Menu = lazy(() => import('./views/Menu'));
const Kitchen = lazy(() => import('./views/Kitchen'));
const KitchenLock = lazy(() => import('./views/KitchenLock'));
const OrderTracking = lazy(() => import('./views/OrderTracking'));
const Admin = lazy(() => import('./views/Admin'));

type View = 'home' | 'menu' | 'kitchen-lock' | 'kitchen' | 'confirmation' | 'admin';

type PlacedOrder = { id: string; number: number; type: OrderType };

// El último pedido realizado se guarda en localStorage para que el acceso al
// seguimiento persista aunque el cliente vuelva al inicio, haga otro pedido o
// recargue la página.
const PLACED_ORDER_KEY = 'werner:placedOrder';

function loadPlacedOrder(): PlacedOrder | null {
  try {
    const raw = localStorage.getItem(PLACED_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlacedOrder;
    if (parsed && parsed.id && typeof parsed.number === 'number' && parsed.type) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function getInitialView(): View {
  const h = window.location.hash;
  if (h === '#/admin') return 'admin';
  if (h === '#/cocina') return 'kitchen-lock';
  return 'home';
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-premium">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>(getInitialView);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(loadPlacedOrder);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Sincroniza el pedido activo con localStorage para que el seguimiento persista.
  useEffect(() => {
    try {
      if (placedOrder) {
        localStorage.setItem(PLACED_ORDER_KEY, JSON.stringify(placedOrder));
      } else {
        localStorage.removeItem(PLACED_ORDER_KEY);
      }
    } catch {
      /* almacenamiento no disponible: el seguimiento sólo durará la sesión */
    }
  }, [placedOrder]);

  useEffect(() => {
    const syncViewFromHash = async () => {
      const h = window.location.hash;
      if (h === '#/admin') {
        setView('admin');
        return;
      }
      if (h === '#/cocina') {
        const { data: { session } } = await supabase.auth.getSession();
        setView(session?.user ? 'kitchen' : 'kitchen-lock');
        return;
      }
      if (h === '') {
        setView('home');
      }
    };

    syncViewFromHash();

    const onHashChange = () => {
      void syncViewFromHash();
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goHome = () => { window.location.hash = ''; setView('home'); };
  const goKitchenLock = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    window.location.hash = '#/cocina';
    setView(session?.user ? 'kitchen' : 'kitchen-lock');
  };
  const unlockKitchen = () => setView('kitchen');
  // El personal ya está autenticado al moverse entre paneles → sin pasar de nuevo por el lock.
  const goAdmin = () => { window.location.hash = '#/admin'; setView('admin'); };
  const goKitchen = () => { window.location.hash = '#/cocina'; setView('kitchen'); };
  const goTracking = () => { window.location.hash = ''; setView('confirmation'); };

  // El acceso flotante al seguimiento sólo se muestra en las vistas del cliente
  // (inicio y menú) cuando hay un pedido activo y no se está viendo ya.
  const showTrackingFab = placedOrder && (view === 'home' || view === 'menu');

  return (
    <Suspense fallback={<Loading />}>
      {view === 'home' && (
        <Home
          onOrder={(locId) => { setSelectedLocationId(locId); setView('menu'); }}
          onKitchenAccess={goKitchenLock}
        />
      )}
      {view === 'menu' && (
        <Menu
          locationId={selectedLocationId}
          onBack={() => setView('home')}
          onOrderPlaced={(order) => { setPlacedOrder(order); setView('confirmation'); }}
        />
      )}
      {view === 'kitchen-lock' && <KitchenLock onUnlock={unlockKitchen} onBack={goHome} />}
      {view === 'kitchen' && <Kitchen onBack={goHome} onGoAdmin={goAdmin} />}
      {view === 'admin' && <Admin onBack={goHome} onGoKitchen={goKitchen} />}
      {view === 'confirmation' && placedOrder && (
        <OrderTracking
          orderId={placedOrder.id}
          orderNumber={placedOrder.number}
          orderType={placedOrder.type}
          onBackHome={() => { window.location.hash = ''; setView('home'); }}
          onOrderAgain={() => setView('menu')}
        />
      )}

      {showTrackingFab && placedOrder && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-fade-up sm:left-5 sm:translate-x-0">
          <div className="flex items-center gap-1 rounded-2xl border border-gold/40 bg-ink/95 pl-1 pr-1 shadow-glow-gold backdrop-blur">
            <button
              onClick={goTracking}
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-extrabold text-white transition-colors hover:text-gold min-h-[48px]"
            >
              <PackageSearch className="h-5 w-5 text-gold" />
              Seguir mi pedido
              <span className="font-display text-gold">#{placedOrder.number}</span>
            </button>
            <button
              onClick={() => setPlacedOrder(null)}
              aria-label="Ocultar seguimiento"
              className="grid h-9 w-9 place-items-center rounded-xl text-white/45 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Suspense>
  );
}
