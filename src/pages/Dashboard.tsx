import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Boxes, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, LayoutDashboard, PackagePlus, Search, ShoppingCart, Sparkles, Store, TrendingUp, Truck, Users, UtensilsCrossed, Warehouse } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../context/CartContext';
import POS from './POS';
import Kitchen from './Kitchen';
import Delivery from './Delivery';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://127.0.0.1:5174' : 'https://wernerburger.onrender.com');
const api = (path: string) => `${API_BASE}${path}`;

type Section = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'pos' | 'users' | 'kitchen' | 'delivery';

interface MenuItem {
  key: Section;
  label: string;
  icon: typeof LayoutDashboard;
}

interface SalesSummary {
  branch_id: string;
  total: number;
  count: number;
}

interface UserRecord {
  id: string;
  username: string;
  email?: string;
  branch_id?: string | null;
  role?: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface InventoryItem {
  id: string;
  branch_id: string;
  ingredient_id: string;
  qty: number;
  unit?: string | null;
  ingredient_name?: string;
  updated_at?: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit?: string | null;
}

interface PurchaseRecord {
  id: string;
  branch_id: string;
  user_id?: string | null;
  total: number;
  created_at?: string;
  items?: Array<{ id: string; purchase_id: string; ingredient_id: string; quantity: number; unit_price: number }>;
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
  const { user, getAccessToken } = useAuth();
  const [section, setSection] = useState<Section>(() => (currentUser?.role === 'admin' ? 'inventory' : 'dashboard'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryStatus, setInventoryStatus] = useState('');
  const [stockQty, setStockQty] = useState('0');
  const [stockIngredientId, setStockIngredientId] = useState('');
  const [adjustQty, setAdjustQty] = useState('0');
  const [adjustReason, setAdjustReason] = useState('Ajuste de stock');
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary[]>([]);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'kitchen' | 'delivery'>('manager');
  const [newUserBranchId, setNewUserBranchId] = useState('');
  const [usersStatus, setUsersStatus] = useState('');
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

  const authHeaders = getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : undefined;

  const loadBranchesAndIngredients = async () => {
    try {
      const [branchesRes, ingredientsRes, rolesRes] = await Promise.all([
        fetch(api('/branches'), { headers: authHeaders }),
        fetch(api('/ingredients'), { headers: authHeaders }),
        fetch(api('/roles'), { headers: authHeaders }),
      ]);
      const branchesData = await branchesRes.json();
      const ingredientsData = await ingredientsRes.json();
      const rolesData = await rolesRes.json();
      const nextBranches = Array.isArray(branchesData) ? branchesData : [];
      const nextIngredients = Array.isArray(ingredientsData) ? ingredientsData : [];
      const nextRoles = Array.isArray(rolesData) ? rolesData : [];
      setBranches(nextBranches);
      setIngredients(nextIngredients);
      setRoles(nextRoles);
      const branchFromUser = user?.user_metadata?.branch_id || user?.branch_id || nextBranches[0]?.id || '';
      setSelectedBranchId((current) => current || branchFromUser);
      if (branchFromUser) {
        await loadInventory(branchFromUser);
      }
      if (!stockIngredientId && nextIngredients[0]?.id) {
        setStockIngredientId(nextIngredients[0].id);
      }
      if (!newUserBranchId && branchFromUser) {
        setNewUserBranchId(branchFromUser);
      }
    } catch (error) {
      setInventoryStatus('No se pudo cargar datos de inventario');
    }
  };

  const normalizeInventoryItem = (item: any): InventoryItem => ({
    id: item.id,
    branch_id: item.branch_id,
    ingredient_id: item.ingredient_id,
    qty: Number(item.qty || 0),
    unit: item.unit || item.ingredients?.unit || 'unidad',
    ingredient_name: item.ingredient_name || item.ingredients?.name || item.ingredient_id,
    updated_at: item.updated_at || item.updatedAt || '',
  });

  const loadUsers = async () => {
    try {
      const res = await fetch(api('/users'), { headers: authHeaders });
      const data = await res.json();
      setUsersList(Array.isArray(data) ? data : []);
    } catch {
      setUsersList([]);
    }
  };

  const handleCreateUser = async () => {
    setUsersStatus('Creando usuario...');
    try {
      const payload = {
        username: newUsername.trim(),
        email: newEmail.trim() || undefined,
        password: newPassword,
        branch_id: newUserBranchId || null,
        role: newRole,
      };
      if (!payload.username || !payload.password) {
        setUsersStatus('Completa usuario y contraseña');
        return;
      }
      const res = await fetch(api('/users'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el usuario');
      setUsersList((current) => [data, ...current.filter((user) => user.id !== data.id)]);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('manager');
      setUsersStatus(`Usuario creado: ${data.username}`);
    } catch (error: any) {
      setUsersStatus(error.message || 'No se pudo crear el usuario');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('¿Eliminar este usuario y bloquear su acceso?')) return;
    setUsersStatus('Eliminando usuario...');
    try {
      const res = await fetch(api(`/users/${id}`), {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', ...authHeaders },
      });
      const bodyText = await res.text();
      let data: any = null;
      if (bodyText) {
        try {
          data = JSON.parse(bodyText);
        } catch {
          throw new Error(`Respuesta inesperada del servidor: ${bodyText.slice(0, 200)}`);
        }
      }
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar el usuario');
      setUsersList((current) => current.filter((user) => user.id !== id));
      setUsersStatus('Usuario eliminado correctamente');
    } catch (error: any) {
      setUsersStatus(error.message || 'No se pudo eliminar el usuario');
    }
  };

  const loadPurchases = async () => {
    try {
      const res = await fetch(api('/purchases'), { headers: authHeaders });
      const data = await res.json();
      setPurchases(Array.isArray(data) ? data : []);
    } catch {
      setPurchases([]);
    }
  };

  const loadSalesSummary = async () => {
    try {
      const res = await fetch(api('/reports/sales-summary'), { headers: authHeaders });
      const data = await res.json();
      setSalesSummary(Array.isArray(data) ? data : []);
    } catch {
      setSalesSummary([]);
    }
  };

  const loadInventory = async (branchId: string) => {
    if (!branchId) return;
    setInventoryLoading(true);
    setInventoryStatus('Cargando inventario...');
    try {
      const res = await fetch(api(`/inventory/${branchId}`), { headers: authHeaders });
      const data = await res.json();
      const items = Array.isArray(data) ? data.map(normalizeInventoryItem) : [];
      setInventoryItems(items);
      setInventoryStatus('Inventario actualizado');
    } catch (error: any) {
      setInventoryItems([]);
      setInventoryStatus('Error al cargar inventario');
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedBranchId || !stockIngredientId || Number(stockQty) <= 0) {
      setInventoryStatus('Selecciona sucursal, ingrediente y cantidad mayor a 0');
      return;
    }
    setInventoryStatus('Registrando entrada de stock...');
    setInventoryLoading(true);
    try {
      const ingredient = ingredients.find((item) => item.id === stockIngredientId);
      const payload = {
        branch_id: selectedBranchId,
        user_id: user?.id || 'admin',
        total: 0,
        items: [{ ingredient_id: stockIngredientId, quantity: Number(stockQty), unit_price: 0, unit: ingredient?.unit || 'unidad' }],
      };
      const res = await fetch(api('/purchases'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la entrada');
      await loadInventory(selectedBranchId);
      setInventoryStatus(`Stock agregado: ${ingredient?.name || stockIngredientId}`);
      setStockQty('0');
    } catch (error: any) {
      setInventoryStatus(error.message || 'Error al agregar stock');
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedBranchId || !stockIngredientId || Number(adjustQty) === 0) {
      setInventoryStatus('Selecciona sucursal, ingrediente y cantidad distinta de 0');
      return;
    }
    setInventoryStatus('Ajustando inventario...');
    setInventoryLoading(true);
    try {
      const payload = {
        ingredient_id: stockIngredientId,
        change: Number(adjustQty),
        reason: adjustReason || 'Ajuste de stock',
        unit: ingredients.find((item) => item.id === stockIngredientId)?.unit || 'unidad',
      };
      const res = await fetch(api(`/inventory/${selectedBranchId}/adjust`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo ajustar el inventario');
      await loadInventory(selectedBranchId);
      setInventoryStatus(`Inventario ajustado: ${adjustQty}`);
      setAdjustQty('0');
    } catch (error: any) {
      setInventoryStatus(error.message || 'Error al ajustar inventario');
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    void loadBranchesAndIngredients();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      void loadInventory(selectedBranchId);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (section === 'purchases') {
      void loadPurchases();
    } else if (section === 'sales') {
      void loadSalesSummary();
    } else if (section === 'users') {
      void loadUsers();
    }
  }, [section]);

  const lowStockCount = inventoryItems.filter((item) => item.qty <= 5).length;
  const totalProducts = inventoryItems.length;

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
              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Inventario</p>
                      <h2 className="text-2xl font-black text-white">Control de stock</h2>
                      <p className="mt-2 text-sm text-gray-400">Administra existencias por sucursal y registra entradas o ajustes de inventario en tiempo real.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        Sucursal
                        <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className="rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                          ))}
                        </select>
                      </label>
                      <button type="button" onClick={() => selectedBranchId && void loadInventory(selectedBranchId)} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-400/15">Actualizar</button>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-400">Productos con stock bajo</p>
                      <p className="mt-3 text-3xl font-black text-amber-200">{lowStockCount}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-400">Total de elementos</p>
                      <p className="mt-3 text-3xl font-black text-white">{totalProducts}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-400">Última actualización</p>
                      <p className="mt-3 text-3xl font-black text-white">{inventoryItems[0]?.updated_at ? new Date(inventoryItems[0].updated_at).toLocaleString('es-PA') : '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
                  <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Listado de inventario</p>
                        <h3 className="text-xl font-black text-white">Existencias por ingrediente</h3>
                      </div>
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">{inventoryLoading ? 'Cargando...' : 'Datos actualizados'}</span>
                    </div>
                    <div className="overflow-x-auto rounded-[18px] border border-white/10 bg-black/40">
                      <table className="w-full min-w-full text-sm text-left">
                        <thead className="bg-white/5 text-gray-300">
                          <tr>
                            <th className="px-3 py-3">Ingrediente</th>
                            <th className="px-3 py-3">Stock</th>
                            <th className="px-3 py-3">Unidad</th>
                            <th className="px-3 py-3">Última actualización</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryItems.map((item) => (
                            <tr key={item.id} className="border-t border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                              <td className="px-3 py-3 font-semibold text-white">{item.ingredient_name}</td>
                              <td className={`px-3 py-3 font-black ${item.qty <= 5 ? 'text-amber-300' : 'text-white'}`}>{item.qty}</td>
                              <td className="px-3 py-3 text-gray-300">{item.unit}</td>
                              <td className="px-3 py-3 text-gray-400">{item.updated_at ? new Date(item.updated_at).toLocaleString('es-PA') : '—'}</td>
                            </tr>
                          ))}
                          {inventoryItems.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-6 text-center text-gray-400">No hay inventario disponible para esta sucursal.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                      <div className="mb-4">
                        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Registrar entrada</p>
                        <h3 className="text-xl font-black text-white">Agregar stock</h3>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm text-gray-300">
                          Ingrediente
                          <select value={stockIngredientId} onChange={(e) => setStockIngredientId(e.target.value)} className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                            {ingredients.map((ingredient) => (
                              <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm text-gray-300">
                          Cantidad
                          <input value={stockQty} onChange={(e) => setStockQty(e.target.value)} type="number" min="1" className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
                        </label>
                        <button type="button" onClick={handleAddStock} disabled={inventoryLoading || !selectedBranchId} className="w-full rounded-[14px] bg-amber-500 px-4 py-3 text-sm font-black text-stone-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">Registrar entrada</button>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                      <div className="mb-4">
                        <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Ajustar stock</p>
                        <h3 className="text-xl font-black text-white">Corrección de inventario</h3>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm text-gray-300">
                          Ingrediente
                          <select value={stockIngredientId} onChange={(e) => setStockIngredientId(e.target.value)} className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                            {ingredients.map((ingredient) => (
                              <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm text-gray-300">
                          Cambio de cantidad
                          <input value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} type="number" className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Motivo
                          <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
                        </label>
                        <button type="button" onClick={handleAdjustStock} disabled={inventoryLoading || !selectedBranchId} className="w-full rounded-[14px] bg-sky-500 px-4 py-3 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">Aplicar ajuste</button>
                      </div>
                    </div>

                    {inventoryStatus && <div className="rounded-[18px] border border-white/10 bg-white/5 p-4 text-sm text-gray-200">{inventoryStatus}</div>}
                  </div>
                </div>
              </div>
            )}

            {section === 'purchases' && (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Compras</p>
                      <h2 className="text-2xl font-black text-white">Registro de compras</h2>
                      <p className="mt-2 text-sm text-gray-400">Visualiza las compras registradas por sucursal y control administrativo.</p>
                    </div>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">{purchases.length} registros</span>
                  </div>

                  <div className="overflow-x-auto rounded-[18px] border border-white/10 bg-black/40">
                    <table className="w-full min-w-full text-sm text-left">
                      <thead className="bg-white/5 text-gray-300">
                        <tr>
                          <th className="px-3 py-3">ID de compra</th>
                          <th className="px-3 py-3">Sucursal</th>
                          <th className="px-3 py-3">Total</th>
                          <th className="px-3 py-3">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((purchase) => (
                          <tr key={purchase.id} className="border-t border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-3 py-3 font-semibold text-white">{purchase.id}</td>
                            <td className="px-3 py-3 text-gray-300">{purchase.branch_id || 'N/A'}</td>
                            <td className="px-3 py-3 text-amber-200">${purchase.total.toFixed(2)}</td>
                            <td className="px-3 py-3 text-gray-400">{purchase.created_at ? new Date(purchase.created_at).toLocaleString('es-PA') : '—'}</td>
                          </tr>
                        ))}
                        {purchases.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-gray-400">No hay compras registradas aún.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {section === 'sales' && (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Ventas</p>
                      <h2 className="text-2xl font-black text-white">Reporte de ventas</h2>
                      <p className="mt-2 text-sm text-gray-400">Resumen de ingresos por sucursal y volumen de pedidos registrados.</p>
                    </div>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">{salesSummary.length} sucursales</span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-400">Ventas hoy</p>
                      <p className="mt-2 text-3xl font-black text-amber-200">${metrics.salesToday.toFixed(2)}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-400">Pedidos completados</p>
                      <p className="mt-2 text-3xl font-black text-white">{metrics.completedOrders}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-400">Ventas totales</p>
                      <p className="mt-2 text-3xl font-black text-amber-200">${salesSummary.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto rounded-[18px] border border-white/10 bg-black/40">
                    <table className="w-full min-w-full text-sm text-left">
                      <thead className="bg-white/5 text-gray-300">
                        <tr>
                          <th className="px-3 py-3">Sucursal</th>
                          <th className="px-3 py-3">Total ventas</th>
                          <th className="px-3 py-3">Pedidos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesSummary.map((entry) => (
                          <tr key={entry.branch_id} className="border-t border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                            <td className="px-3 py-3 font-semibold text-white">{entry.branch_id || 'Sin sucursal'}</td>
                            <td className="px-3 py-3 text-amber-200">${entry.total.toFixed(2)}</td>
                            <td className="px-3 py-3 text-gray-300">{entry.count}</td>
                          </tr>
                        ))}
                        {salesSummary.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-6 text-center text-gray-400">No hay datos de ventas disponibles.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {section === 'pos' && <POS />}
            {section === 'users' && (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Usuarios</p>
                      <h2 className="text-2xl font-black text-white">Gestión de usuarios</h2>
                      <p className="mt-2 text-sm text-gray-400">Crea cuentas, asigna roles y borra usuarios para bloquear su acceso.</p>
                    </div>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">{usersList.length} cuentas</span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
                    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-400">Crear nuevo usuario</p>
                      <div className="mt-4 space-y-3">
                        <label className="block text-sm text-gray-300">
                          Usuario
                          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="username" />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Correo
                          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="usuario@dominio.com" />
                        </label>
                        <label className="block text-sm text-gray-300">
                          Contraseña
                          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="********" />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block text-sm text-gray-300">
                            Rol
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'manager' | 'kitchen' | 'delivery')} className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                              {roles.length > 0 ? (
                                roles.map((role) => (
                                  <option key={role.id} value={role.name}>{role.name}</option>
                                ))
                              ) : (
                                <>
                                  <option value="admin">admin</option>
                                  <option value="manager">manager</option>
                                  <option value="kitchen">kitchen</option>
                                  <option value="delivery">delivery</option>
                                </>
                              )}
                            </select>
                          </label>
                          <label className="block text-sm text-gray-300">
                            Sucursal
                            <select value={newUserBranchId} onChange={(e) => setNewUserBranchId(e.target.value)} className="mt-2 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                              <option value="">Todas</option>
                              {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <button type="button" onClick={handleCreateUser} className="w-full rounded-[14px] bg-amber-500 px-4 py-3 text-sm font-black text-stone-900 transition hover:brightness-110">Crear usuario</button>
                        {usersStatus && <p className="text-sm text-gray-300">{usersStatus}</p>}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-400">Usuarios existentes</p>
                      <div className="mt-4 overflow-x-auto rounded-[18px] border border-white/10 bg-black/40">
                        <table className="w-full min-w-full text-sm text-left">
                          <thead className="bg-white/5 text-gray-300">
                            <tr>
                              <th className="px-3 py-3">Usuario</th>
                              <th className="px-3 py-3">Correo</th>
                              <th className="px-3 py-3">Rol</th>
                              <th className="px-3 py-3">Sucursal</th>
                              <th className="px-3 py-3">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersList.map((userItem) => (
                              <tr key={userItem.id} className="border-t border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                <td className="px-3 py-3 font-semibold text-white">{userItem.username}</td>
                                <td className="px-3 py-3 text-gray-300">{userItem.email || '—'}</td>
                                <td className="px-3 py-3 text-amber-200">{userItem.role || '—'}</td>
                                <td className="px-3 py-3 text-gray-300">{userItem.branch_id || 'Todas'}</td>
                                <td className="px-3 py-3">
                                  <button onClick={() => handleDeleteUser(userItem.id)} className="rounded-[12px] bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-400">Eliminar</button>
                                </td>
                              </tr>
                            ))}
                            {usersList.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">No hay usuarios cargados.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
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
          </main>
        </div>
      </div>
    </div>
  );
}
