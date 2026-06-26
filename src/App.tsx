import { useState, useEffect } from 'react';
import Home from './views/Home';
import Menu from './views/Menu';
import Kitchen from './views/Kitchen';
import KitchenLock from './views/KitchenLock';
import OrderConfirmation from './views/OrderConfirmation';

type View = 'home' | 'menu' | 'kitchen-lock' | 'kitchen' | 'confirmation';

function getInitialView(): View {
  if (window.location.hash === '#/cocina') return 'kitchen-lock';
  return 'home';
}

export default function App() {
  const [view, setView] = useState<View>(getInitialView);
  const [orderNumber, setOrderNumber] = useState(0);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#/cocina') {
        setView('kitchen-lock');
      }
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const goHome = () => {
    window.location.hash = '';
    setView('home');
  };

  const goKitchenLock = () => {
    window.location.hash = '#/cocina';
    setView('kitchen-lock');
  };

  const unlockKitchen = () => {
    setView('kitchen');
  };

  return (
    <>
      {view === 'home' && (
        <Home
          onOrder={(locId) => {
            setSelectedLocationId(locId);
            setView('menu');
          }}
          onKitchenAccess={goKitchenLock}
        />
      )}
      {view === 'menu' && (
        <Menu
          locationId={selectedLocationId}
          onBack={() => setView('home')}
          onOrderPlaced={(num) => {
            setOrderNumber(num);
            setView('confirmation');
          }}
        />
      )}
      {view === 'kitchen-lock' && (
        <KitchenLock onUnlock={unlockKitchen} onBack={goHome} />
      )}
      {view === 'kitchen' && <Kitchen onBack={goHome} />}
      {view === 'confirmation' && (
        <OrderConfirmation
          orderNumber={orderNumber}
          onBackHome={() => setView('home')}
          onOrderAgain={() => setView('menu')}
        />
      )}
    </>
  );
}
