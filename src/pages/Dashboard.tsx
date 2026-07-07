import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, Boxes, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, LayoutDashboard, PackagePlus, Search, ShoppingCart, Sparkles, Store, TrendingUp, Truck, Users, UtensilsCrossed, Warehouse } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useCart } from '../context/CartContext';
import Admin from './Admin';
import POS from './POS';
import Kitchen from './Kitchen';
import Delivery from './Delivery';

type Section = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'pos' | 'users' | 'alerts' | 'kitchen' | 'delivery' | 'reports';

interface MenuItem {
  key: Section;
  label: string;
  icon: typeof LayoutDashboard;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inventory', label: 'Inventario', icon: Warehouse },
  { key: 'purchases', label: 'Compras', icon: ShoppingCart },
  { key: 'sales', label: 'Ventas', icon: CircleDollarSign },
  { key: 'pos', label: 'POS', icon: PackagePlus },
  { key: 'kitchen', label: 'Cocina', icon: UtensilsCrossed },
  { key: 'delivery', label: 'Delivery', icon: Truck },
  { key: 'users', label: 'Usuarios', icon: Users },
  { key: 'alerts', label: 'Alertas', icon: AlertTriangle },
  { key: 'reports', label: 'Reportes', icon: TrendingUp },
];

const hourlySales = [
  { name: '08:00', ventas: 24 },
  { name: '10:00', ventas: 38 },
  { name: '12:00', ventas: 54 },
  { name: '14:00', ventas: 71 },
  { name: '16:00', ventas: 66 },
  { name: '18:00', ventas: 82 },
];

const weeklySales = [
  { name: 'L', ventas: 42 },
  { name: 'M', ventas: 58 },
  { name: 'M', ventas: 61 },
  { name: 'J', ventas: 76 },
  { name: 'V', ventas: 92 },
  { name: 'S', ventas: 118 },
  { name: 'D', ventas: 104 },
];

const productMix = [
  { name: 'Burgers', value: 42, color: '#d4af37' },
  { name: 'Bebidas', value: 24, color: '#f59e0b' },
  { name: 'Extras', value: 20, color: '#fbbf24' },
  { name: 'Combos', value: 14, color: '#92400e' },
];

function StatCard({ label, value, hint, icon: Icon, accent }: { label: string; value: string; hint: string; icon: typeof LayoutDashboard; accent: string }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} className="rounded-[18px] border border-white/10 bg-[#101010]/85 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{hint}</p>
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

interface DashboardProps {
  currentUser?: { username?: string; branch_id?: string | null; role?: string } | null;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [section, setSection] = useState<Section>(() => (currentUser?.role === 'admin' ? 'inventory' : 'dashboard'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { orders } = useCart();

  const metrics = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const salesToday = orders.filter((order) => order.placedAt >= startOfToday.getTime()).reduce((sum, order) => sum + order.total, 0);
    const salesMonth = orders.reduce((sum, order) => sum + order.total, 0);
    const activeOrders = orders.filter((order) => ['pending', 'accepted', 'preparing', 'ready', 'assigned', 'delivering'].includes(order.status)).length;
    const pendingOrders = orders.filter((order) => order.status === 'pending').length;
    const completedOrders = orders.filter((order) => order.status === 'completed').length;

    return {
      salesToday,
      salesMonth,
      activeOrders,
      pendingOrders,
      completedOrders,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_30%),linear-gradient(135deg,_#060606_0%,_#101010_55%,_#050505_100%)] px-2 py-3 text-white sm:px-3 lg:px-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row">
        <aside className={`hidden rounded-[24px] border border-white/10 bg-[#0b0b0b]/85 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl lg:flex lg:flex-col ${sidebarCollapsed ? 'lg:w-[clamp(5.5rem,14vw,18rem)]' : 'lg:w-[clamp(17rem,22vw,22rem)]'}`}>
          <div className="mb-6 flex items-center justify-between gap-3">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 overflow-hidden">
                  <img src="/werner-favicon.png" alt="Werner Burger logo" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300/70">WERNER BURGER</p>
                  <h2 className="text-lg font-black text-white">Admin Studio</h2>
                </div>
              </div>
            )}
            <button onClick={() => setSidebarCollapsed((value) => !value)} className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10">
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <div className="mb-5 rounded-[18px] border border-amber-400/20 bg-gradient-to-br from-amber-400/15 to-transparent p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/20 text-sm font-black text-amber-200">W</div>
              {!sidebarCollapsed && (
                <div>
                  <p className="text-sm font-semibold text-white">WERNER BURGER</p>
                </div>
              )}
            </div>

            <nav className="mt-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.key;
                return (
                  <button key={item.key} onClick={() => setSection(item.key)} className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm transition ${active ? 'bg-gradient-to-r from-amber-500/20 to-transparent text-amber-100 shadow-[0_10px_30px_rgba(212,175,55,0.15)]' : 'text-gray-300 hover:bg-white/8 hover:text-white'}`}>
                    <Icon className="h-4 w-4" />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[18px] border border-white/10 bg-white/5 p-3 text-sm text-gray-400">
              <p className="font-semibold text-white">Operación</p>
              <p className="mt-1">Sistema premium listo para restaurante</p>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="rounded-[24px] border border-white/10 bg-[#0b0b0b]/85 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3 rounded-[16px] border border-white/10 bg-white/5 px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500" placeholder="Buscar órdenes, productos o clientes" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">
                  <Store className="h-4 w-4 text-amber-300" />
                  Sucursal Central
                </div>
                <div className="flex items-center gap-2 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">
                  <CalendarDays className="h-4 w-4 text-amber-300" />
                  Hoy
                </div>
                <button className="rounded-[14px] border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-2 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 font-black text-black">A</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{currentUser?.username || 'Admin'}</p>
                    <p className="text-xs text-gray-400">{currentUser?.branch_id ? 'Sucursal asignada' : 'Operador premium'}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-3 flex gap-2 overflow-x-auto rounded-[20px] border border-white/10 bg-[#0b0b0b]/70 p-2 lg:hidden">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.key;
              return (
                <button key={item.key} onClick={() => setSection(item.key)} className={`flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm whitespace-nowrap ${active ? 'bg-amber-500/20 text-amber-100' : 'bg-white/5 text-gray-300'}`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <main className="mt-3 rounded-[24px] border border-white/10 bg-[#0b0b0b]/80 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-5">
            {section === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-col gap-3 rounded-[22px] border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-transparent to-orange-500/10 p-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-amber-300/70">Resumen ejecutivo</p>
                    <h2 className="mt-2 text-3xl font-black text-white">Control total del negocio</h2>
                    <p className="mt-2 max-w-2xl text-sm text-gray-400">Una vista premium del movimiento diario, inventario, pedidos y métricas de rendimiento.</p>
                  </div>
                  <div className="rounded-[16px] border border-white/10 bg-[#111]/70 px-4 py-3 text-sm text-gray-300">
                    <p className="font-semibold text-white">Pedidos activos</p>
                    <p className="mt-1 text-2xl font-black text-amber-200">{metrics.activeOrders}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <StatCard label="Ventas del día" value={`$${metrics.salesToday.toFixed(2)}`} hint="Rendimiento actual" icon={CircleDollarSign} accent="bg-amber-400/15 text-amber-200" />
                  <StatCard label="Ventas del mes" value={`$${metrics.salesMonth.toFixed(2)}`} hint="Acumulado mensual" icon={TrendingUp} accent="bg-emerald-400/15 text-emerald-200" />
                  <StatCard label="Órdenes activas" value={String(metrics.activeOrders)} hint="En proceso" icon={Clock3} accent="bg-sky-400/15 text-sky-200" />
                  <StatCard label="Productos bajos" value="4" hint="Reabastecimiento" icon={Boxes} accent="bg-rose-400/15 text-rose-200" />
                  <StatCard label="Ganancia estimada" value={`$${(metrics.salesToday * 0.58).toFixed(2)}`} hint="Margen esperado" icon={Sparkles} accent="bg-violet-400/15 text-violet-200" />
                  <StatCard label="Clientes atendidos" value={String(metrics.completedOrders)} hint="Atendidos" icon={Users} accent="bg-indigo-400/15 text-indigo-200" />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Ventas</p>
                        <h3 className="text-xl font-black text-white">Por hora</h3>
                      </div>
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">Hoy</span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourlySales}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="name" stroke="#8c8c8c" tickLine={false} axisLine={false} />
                          <YAxis stroke="#8c8c8c" tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="ventas" stroke="#d4af37" strokeWidth={3} dot={{ r: 4, fill: '#fef3c7' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Popularidad</p>
                        <h3 className="text-xl font-black text-white">Más vendidos</h3>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">Semana</span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={productMix} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                            {productMix.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Ritmo</p>
                        <h3 className="text-xl font-black text-white">Ventas semanales</h3>
                      </div>
                      <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-200">7 días</span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklySales}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="name" stroke="#8c8c8c" tickLine={false} axisLine={false} />
                          <YAxis stroke="#8c8c8c" tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Bar dataKey="ventas" radius={[10, 10, 0, 0]} fill="#d4af37" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Operaciones</p>
                        <h3 className="text-xl font-black text-white">Alertas rápidas</h3>
                      </div>
                      <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-sm text-rose-200">Prioridad</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Stock bajo', value: '4 productos', tone: 'text-amber-200' },
                        { label: 'Compras pendientes', value: '2 recibos', tone: 'text-sky-200' },
                        { label: 'Pedidos retrasados', value: '3 órdenes', tone: 'text-rose-200' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3">
                          <div>
                            <p className="font-semibold text-white">{item.label}</p>
                            <p className="text-sm text-gray-400">{item.value}</p>
                          </div>
                          <div className={`rounded-full bg-white/10 px-3 py-1 text-sm ${item.tone}`}>Atención</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {section === 'inventory' && (
              <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Operación</p>
                    <h2 className="text-2xl font-black text-white">Inventario</h2>
                  </div>
                  <button className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">Agregar stock</button>
                </div>
                <Admin />
              </div>
            )}

            {section === 'purchases' && (
              <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="text-2xl font-black text-white">Compras</h2>
                <div className="mt-6 space-y-3">
                  {['Proveedor A', 'Proveedor B', 'Proveedor C'].map((provider, index) => (
                    <div key={provider} className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">{provider}</p>
                        <p className="text-sm text-gray-400">Factura #{100 + index}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-200">${(1200 + index * 250).toFixed(2)}</p>
                        <p className="text-sm text-gray-400">Pendiente</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === 'sales' && (
              <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="text-2xl font-black text-white">Ventas</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-gray-400">Ventas hoy</p>
                    <p className="mt-2 text-3xl font-black text-amber-200">${metrics.salesToday.toFixed(2)}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-gray-400">Pedidos completados</p>
                    <p className="mt-2 text-3xl font-black text-white">{metrics.completedOrders}</p>
                  </div>
                </div>
              </div>
            )}

            {section === 'pos' && <POS />}
            {section === 'users' && (
              <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="text-2xl font-black text-white">Usuarios</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {['Admin', 'Cocina', 'Delivery'].map((role) => (
                    <div key={role} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                      <p className="font-semibold text-white">{role}</p>
                      <p className="mt-2 text-sm text-gray-400">Acceso completo al módulo correspondiente</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {section === 'alerts' && (
              <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <Admin />
              </div>
            )}
            {section === 'kitchen' && (
              <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <Kitchen onNavigate={() => setSection('delivery')} />
              </div>
            )}
            {section === 'delivery' && (
              <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <Delivery />
              </div>
            )}
            {section === 'reports' && (
              <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <h2 className="text-2xl font-black text-white">Reportes</h2>
                <div className="mt-6 flex flex-wrap gap-3">
                  {['Hoy', 'Semana', 'Mes', 'Personalizado'].map((filter) => (
                    <button key={filter} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10">{filter}</button>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {['PDF', 'Excel', 'CSV'].map((format) => (
                    <div key={format} className="rounded-[16px] border border-white/10 bg-white/5 p-4 text-center text-sm text-gray-300">Exportar {format}</div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
