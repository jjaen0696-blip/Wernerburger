import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Home from './views/Home';
import type { OrderType } from './lib/supabase';

// Code-splitting: la app del cliente sólo carga Home al inicio.
// El menú, la cocina y el panel de inventario se cargan bajo demanda.
const Menu = lazy(() => import('./views/Menu'));
const Kitchen = lazy(() => import('./views/Kitchen'));
const KitchenLock = lazy(() => import('./views/KitchenLock'));
const OrderTracking = lazy(() => import('./views/OrderTracking'));
const Admin = lazy(() => import('./views/Admin'));

type View = 'home' | 'menu' | 'kitchen-lock' | 'kitchen' | 'confirmation' | 'admin';

type PlacedOrder = { id: string; number: number; type: OrderType };

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
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash;
      if (h === '#/admin') setView('admin');
      else if (h === '#/cocina') setView('kitchen-lock');
      else if (h === '') setView('home');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goHome = () => { window.location.hash = ''; setView('home'); };
  const goKitchenLock = () => { window.location.hash = '#/cocina'; setView('kitchen-lock'); };
  const unlockKitchen = () => setView('kitchen');
  // El personal ya está autenticado al moverse entre paneles → sin pasar de nuevo por el lock.
  const goAdmin = () => { window.location.hash = '#/admin'; setView('admin'); };
  const goKitchen = () => { window.location.hash = '#/cocina'; setView('kitchen'); };

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
          onBackHome={() => setView('home')}
          onOrderAgain={() => setView('menu')}
        />
      )}
    </Suspense>
  );
}
