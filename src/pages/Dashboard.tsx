import { useState } from 'react';
import Admin from './Admin';
import POS from './POS';
import Kitchen from './Kitchen';
import Delivery from './Delivery';

type Section = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'pos' | 'users' | 'alerts' | 'kitchen' | 'delivery' | 'reports';

export default function Dashboard() {
  const [section, setSection] = useState<Section>('dashboard');

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#080706] to-[#050404] text-white">
      <aside className="w-72 bg-[#0b0a09]/90 border-r border-amber-500/10 p-6">
        <div className="mb-6">
          <h3 className="text-sm uppercase text-amber-300 mb-2 font-bold">Panel Administrativo</h3>
          <p className="text-xs text-gray-300">Usuario: Admin</p>
        </div>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setSection('dashboard')} className={`text-left px-3 py-2 rounded-md ${section==='dashboard'?'bg-amber-600/20':'hover:bg-white/3'}`}>Resumen</button>
          <button onClick={() => setSection('inventory')} className={`text-left px-3 py-2 rounded-md ${section==='inventory'?'bg-amber-600/20':'hover:bg-white/3'}`}>Inventario</button>
          <button onClick={() => setSection('purchases')} className={`text-left px-3 py-2 rounded-md ${section==='purchases'?'bg-amber-600/20':'hover:bg-white/3'}`}>Compras</button>
          <button onClick={() => setSection('sales')} className={`text-left px-3 py-2 rounded-md ${section==='sales'?'bg-amber-600/20':'hover:bg-white/3'}`}>Ventas</button>
          <button onClick={() => setSection('pos')} className={`text-left px-3 py-2 rounded-md ${section==='pos'?'bg-amber-600/20':'hover:bg-white/3'}`}>POS</button>
          <button onClick={() => setSection('users')} className={`text-left px-3 py-2 rounded-md ${section==='users'?'bg-amber-600/20':'hover:bg-white/3'}`}>Usuarios</button>
          <button onClick={() => setSection('alerts')} className={`text-left px-3 py-2 rounded-md ${section==='alerts'?'bg-amber-600/20':'hover:bg-white/3'}`}>Alertas</button>
          <button onClick={() => setSection('kitchen')} className={`text-left px-3 py-2 rounded-md ${section==='kitchen'?'bg-amber-600/20':'hover:bg-white/3'}`}>Cocina</button>
          <button onClick={() => setSection('delivery')} className={`text-left px-3 py-2 rounded-md ${section==='delivery'?'bg-amber-600/20':'hover:bg-white/3'}`}>Delivery</button>
          <button onClick={() => setSection('reports')} className={`text-left px-3 py-2 rounded-md ${section==='reports'?'bg-amber-600/20':'hover:bg-white/3'}`}>Reportes</button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {section === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-extrabold mb-4">Resumen</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">Ventas hoy<br/><span className="text-2xl font-bold">$0.00</span></div>
              <div className="p-4 bg-white/5 rounded-lg">Productos bajos<br/><span className="text-2xl font-bold">0</span></div>
              <div className="p-4 bg-white/5 rounded-lg">Órdenes pendientes<br/><span className="text-2xl font-bold">0</span></div>
            </div>
          </div>
        )}

        {section === 'inventory' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Inventario</h2>
            <Admin />
          </div>
        )}

        {section === 'purchases' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Compras</h2>
            <p className="text-sm text-gray-300">Registrar compras y ajustar inventario.</p>
          </div>
        )}

        {section === 'sales' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Ventas</h2>
            <p className="text-sm text-gray-300">Resumen de ventas por periodo.</p>
          </div>
        )}

        {section === 'pos' && <POS />}
        {section === 'users' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Usuarios & Roles</h2>
            <p className="text-sm text-gray-300">Gestión de usuarios y permisos.</p>
          </div>
        )}
        {section === 'alerts' && <Admin />}
        {section === 'kitchen' && <Kitchen onNavigate={() => {}} />}
        {section === 'delivery' && <Delivery />}
        {section === 'reports' && <Admin />}
      </main>
    </div>
  );
}
