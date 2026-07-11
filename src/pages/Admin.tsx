import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, PackageCheck, PlusCircle, Store, TrendingUp, Users } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://127.0.0.1:5174' : 'https://wernerburger.onrender.com');
const api = (path: string) => `${API_BASE}${path}`;

type SectionKey = 'overview' | 'inventory' | 'users' | 'branches' | 'ingredients' | 'purchases' | 'adjustments' | 'alerts';

type Branch = { id: string; name: string; address?: string; is_closed?: boolean };
type Ingredient = { id: string; name: string; unit?: string | null };
type InventoryItem = { id: string; branch_id: string; ingredient_id: string; qty: number; unit?: string | null; ingredient_name?: string; updated_at?: string };
type UserRecord = { id: string; username: string; email?: string; branch_id?: string | null; role?: 'admin' | 'manager' | 'kitchen' | 'delivery' };

type IconType = typeof PackageCheck;

const SECTION_ITEMS: Array<{ key: SectionKey; label: string; icon: IconType }> = [
  { key: 'overview', label: 'Resumen', icon: PackageCheck },
  { key: 'inventory', label: 'Inventario', icon: TrendingUp },
  { key: 'users', label: 'Usuarios', icon: Users },
  { key: 'branches', label: 'Sucursales', icon: Store },
  { key: 'ingredients', label: 'Ingredientes', icon: PlusCircle },
  { key: 'purchases', label: 'Compras', icon: ArrowUpRight },
  { key: 'adjustments', label: 'Ajustes', icon: ArrowDownLeft },
  { key: 'alerts', label: 'Alertas', icon: AlertTriangle },
];

export default function Admin() {
  const { getAccessToken } = useAuth();
  const [section, setSection] = useState<SectionKey>('overview');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [branchId, setBranchId] = useState('');
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('unidad');
  const [initialStock, setInitialStock] = useState('0');
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('10');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [adjustQty, setAdjustQty] = useState('5');
  const [adjustReason, setAdjustReason] = useState('ajuste');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'kitchen' | 'delivery'>('manager');
  const [userBranchId, setUserBranchId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchClosed, setBranchClosed] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const totalSales = summary.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalOrders = summary.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

  const loadInventory = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(api(`/inventory/${id}`));
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch {
      setInventory([]);
    }
  };

  const loadData = async (selectedBranchId?: string) => {
    try {
      const token = getAccessToken();
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [branchesRes, ingredientsRes, alertsRes, summaryRes, usersRes] = await Promise.all([
        fetch(api('/branches')),
        fetch(api('/ingredients')),
        fetch(api('/alerts'), { headers: authHeaders }),
        fetch(api('/reports/sales-summary'), { headers: authHeaders }),
        fetch(api('/users'), { headers: authHeaders }),
      ]);

      const branchesData = await branchesRes.json();
      const ingredientsData = await ingredientsRes.json();
      const alertsData = await alertsRes.json();
      const summaryData = await summaryRes.json();
      const usersData = await usersRes.json();

      const nextBranches = Array.isArray(branchesData) ? branchesData : [];
      const nextIngredients = Array.isArray(ingredientsData) ? ingredientsData : [];
      const nextUsers = Array.isArray(usersData) ? usersData : [];
      const storedBranchId = typeof window !== 'undefined' ? localStorage.getItem('werner-branch') : null;
      const nextBranchId = selectedBranchId || storedBranchId || nextBranches[0]?.id || '';

      setBranches(nextBranches);
      setIngredients(nextIngredients);
      setUsers(nextUsers);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setSummary(Array.isArray(summaryData) ? summaryData : []);
      setBranchId(nextBranchId);
      if (nextBranchId) {
        void loadInventory(nextBranchId);
      }
      if (nextIngredients[0]?.id) {
        setSelectedIngredientId((current) => current || nextIngredients[0].id);
      }
    } catch {
      setBranches([]);
      setIngredients([]);
      setUsers([]);
      setAlerts([]);
      setSummary([]);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateIngredient = async (e: FormEvent) => {
    e.preventDefault();
    if (!ingredientName.trim()) return setStatus('Escribe el nombre del ingrediente');
    setBusy(true);
    setStatus('Guardando ingrediente...');
    try {
      const res = await fetch(api('/ingredients'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: ingredientName.trim(),
          unit: ingredientUnit,
          branch_id: branchId,
          initial_stock: Number(initialStock || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear');
      setIngredients((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setSelectedIngredientId(data.id);
      setIngredientName('');
      setInitialStock('0');
      setStatus(`Ingrediente creado: ${data.name}`);
      if (branchId) {
        void loadInventory(branchId);
      }
    } catch (error: any) {
      setStatus(error.message || 'No se pudo crear el ingrediente');
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterPurchase = async (e: FormEvent) => {
    e.preventDefault();
    if (!branchId || !selectedIngredientId) return setStatus('Selecciona una sucursal y un ingrediente');
    setBusy(true);
    setStatus('Registrando entrada de stock...');
    try {
      const res = await fetch(api('/purchases'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          branch_id: branchId,
          user_id: 'admin',
          total: Number(purchasePrice || 0) * Number(purchaseQty || 0),
          items: [{
            ingredient_id: selectedIngredientId,
            quantity: Number(purchaseQty || 0),
            unit_price: Number(purchasePrice || 0),
            unit: ingredientUnit,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la compra');
      setStatus(`Stock registrado para ${ingredients.find((item) => item.id === selectedIngredientId)?.name || 'ingrediente'}`);
      setPurchaseQty('10');
      setPurchasePrice('0');
      if (branchId) {
        void loadInventory(branchId);
      }
    } catch (error: any) {
      setStatus(error.message || 'No se pudo registrar la compra');
    } finally {
      setBusy(false);
    }
  };

  const handleAdjustStock = async (e: FormEvent) => {
    e.preventDefault();
    if (!branchId || !selectedIngredientId) return setStatus('Selecciona un ingrediente');
    setBusy(true);
    setStatus('Actualizando inventario...');
    try {
      const res = await fetch(api(`/inventory/${branchId}/adjust`), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ingredient_id: selectedIngredientId,
          change: Number(adjustQty || 0),
          reason: adjustReason,
          unit: ingredientUnit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo ajustar el stock');
      setStatus(`Inventario actualizado: ${data.qty}`);
      setAdjustQty('5');
      setAdjustReason('ajuste');
      if (branchId) {
        void loadInventory(branchId);
      }
    } catch (error: any) {
      setStatus(error.message || 'No se pudo ajustar el stock');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return setStatus('Completa usuario y contraseña');
    setBusy(true);
    setStatus('Creando usuario...');
    try {
      const res = await fetch(api('/users'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim(), email: newEmail.trim(), password: newPassword, branch_id: userBranchId || null, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el usuario');
      setUsers((current) => [data, ...current.filter((user) => user.id !== data.id)]);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('manager');
      setUserBranchId('');
      setStatus(`Usuario creado: ${data.username}`);
    } catch (error: any) {
      setStatus(error.message || 'No se pudo crear el usuario');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateBranch = async (e: FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return setStatus('Escribe el nombre de la sucursal');
    setBusy(true);
    setStatus(editingBranchId ? 'Actualizando sucursal...' : 'Guardando sucursal...');
    try {
      const url = editingBranchId ? api(`/branches/${editingBranchId}`) : api('/branches');
      const res = await fetch(url, {
        method: editingBranchId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: branchName.trim(), address: branchAddress.trim(), is_closed: branchClosed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la sucursal');
      setBranches((current) => {
        const next = current.filter((item) => item.id !== data.id);
        return [data, ...next];
      });
      setBranchName('');
      setBranchAddress('');
      setBranchClosed(false);
      setEditingBranchId('');
      setStatus(editingBranchId ? `Sucursal actualizada: ${data.name}` : `Sucursal creada: ${data.name}`);
      void loadData(data.id);
    } catch (error: any) {
      setStatus(error.message || 'No se pudo guardar la sucursal');
    } finally {
      setBusy(false);
    }
  };

  const startEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setBranchName(branch.name);
    setBranchAddress(branch.address || '');
    setBranchClosed(Boolean(branch.is_closed));
    setStatus(`Editando ${branch.name}`);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[18px] border border-amber-400/15 bg-white/8 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <p className="text-sm text-gray-400">Ventas del periodo</p>
          <p className="mt-3 text-3xl font-black text-amber-200">${totalSales.toFixed(2)}</p>
        </div>
        <div className="rounded-[18px] border border-amber-400/15 bg-white/8 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <p className="text-sm text-gray-400">Pedidos registrados</p>
          <p className="mt-3 text-3xl font-black text-white">{totalOrders}</p>
        </div>
        <div className="rounded-[18px] border border-amber-400/15 bg-white/8 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <p className="text-sm text-gray-400">Alertas activas</p>
          <p className="mt-3 text-3xl font-black text-white">{alerts.length}</p>
        </div>
      </div>

      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Performance</p>
            <h3 className="text-xl font-black text-white">Resumen de ventas</h3>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {summary.length === 0 ? (
            <div className="rounded-[16px] border border-white/10 bg-white/5 p-6 text-center text-gray-400">No hay datos de resumen disponibles.</div>
          ) : (
            summary.slice(0, 6).map((item, idx) => (
              <div key={idx} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">{item.branch || item.name || `Resumen ${idx + 1}`}</p>
                <p className="text-sm text-gray-400">Pedidos: {item.count ?? 0}</p>
                <p className="mt-2 text-lg font-black text-amber-200">${Number(item.total || 0).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Inventario</p>
            <h3 className="text-xl font-black text-white">Existencias por sucursal</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-gray-300">
              <p className="font-semibold text-white">Sucursal</p>
              <p className="mt-1 text-gray-400">{branches.find((branch) => branch.id === branchId)?.name || 'Selecciona'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-gray-300">
              <p className="font-semibold text-white">Ingrediente</p>
              <p className="mt-1 text-gray-400">{ingredients.find((item) => item.id === selectedIngredientId)?.name || 'Selecciona'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-400">
            Sucursal
            <select value={branchId} onChange={(e) => { setBranchId(e.target.value); void loadData(e.target.value); }} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <label className="block text-sm text-gray-400">
            Ingrediente
            <select value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
              {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-x-auto rounded-[22px] border border-white/10 bg-[#0f0c09]/85 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <table className="w-full min-w-full text-sm">
          <thead className="bg-white/5 text-left text-gray-300">
            <tr>
              <th className="px-3 py-3">Ingrediente</th>
              <th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-t border-white/10 bg-white/5">
                <td className="px-3 py-3 font-semibold text-white">{item.ingredient_name || item.ingredient_id}</td>
                <td className="px-3 py-3 text-amber-200">{item.qty}</td>
                <td className="px-3 py-3 text-gray-400">{item.unit || 'unidad'}</td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-400">Aún no hay stock para esta sucursal.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-300" />
          <h3 className="text-xl font-black text-white">Usuarios</h3>
        </div>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-400">
              Usuario
              <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="usuario" />
            </label>
            <label className="block text-sm text-gray-400">
              Correo
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="correo@dominio.com" />
            </label>
            <label className="block text-sm text-gray-400">
              Contraseña
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
            </label>
            <label className="block text-sm text-gray-400">
              Rol
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'manager' | 'kitchen' | 'delivery')} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                <option value="admin">Administrador</option>
                <option value="manager">Encargado de sucursal</option>
                <option value="kitchen">Cocina</option>
                <option value="delivery">Delivery</option>
              </select>
            </label>
          </div>
          <label className="block text-sm text-gray-400">
            Sucursal asignada
            <select value={userBranchId} onChange={(e) => setUserBranchId(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
              <option value="">Sin sucursal</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <button disabled={busy} className="rounded-[12px] bg-amber-500 px-4 py-2 font-black text-stone-900 transition hover:bg-amber-400 disabled:opacity-60">Crear usuario</button>
        </form>
      </section>

      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-300" />
          <h3 className="text-xl font-black text-white">Lista de usuarios</h3>
        </div>
        <div className="overflow-x-auto rounded-[16px] border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead className="bg-black/20 text-left text-gray-300">
              <tr>
                <th className="px-3 py-3">Usuario</th>
                <th className="px-3 py-3">Correo</th>
                <th className="px-3 py-3">Rol</th>
                <th className="px-3 py-3">Sucursal</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/10 bg-white/5">
                  <td className="px-3 py-3 text-white">{user.username}</td>
                  <td className="px-3 py-3 text-gray-300">{user.email || '—'}</td>
                  <td className="px-3 py-3 text-amber-200">{user.role}</td>
                  <td className="px-3 py-3 text-gray-300">{branches.find((branch) => branch.id === user.branch_id)?.name || '—'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-400">No hay usuarios cargados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderBranches = () => (
    <div className="space-y-6">
      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-emerald-300" />
          <h3 className="text-xl font-black text-white">Sucursales</h3>
        </div>
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-400">
              Nombre
              <input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Sucursal Norte" />
            </label>
            <label className="block text-sm text-gray-400">
              Dirección
              <input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Av. Central 123" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input type="checkbox" checked={branchClosed} onChange={(e) => setBranchClosed(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black/40" />
            Marcar como cerrada por hoy
          </label>
          <button disabled={busy} className="rounded-[12px] bg-emerald-500 px-4 py-2 font-black text-white transition hover:bg-emerald-400 disabled:opacity-60">{editingBranchId ? 'Actualizar sucursal' : 'Guardar sucursal'}</button>
        </form>
      </section>

      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-amber-300" />
          <h3 className="text-xl font-black text-white">Sucursales activas</h3>
        </div>
        <div className="space-y-3">
          {branches.map((branch) => (
            <div key={branch.id} className={`flex items-center justify-between rounded-[14px] border px-3 py-3 ${branch.is_closed ? 'border-rose-500/20 bg-rose-500/10' : 'border-white/10 bg-white/5'}`}>
              <div>
                <p className="font-semibold text-white">{branch.name}</p>
                <p className="text-sm text-gray-400">{branch.address || 'Sin dirección'}</p>
              </div>
              <button onClick={() => startEditBranch(branch)} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-200 transition hover:bg-white/10">Editar</button>
            </div>
          ))}
          {branches.length === 0 && <div className="rounded-[16px] border border-dashed border-white/10 bg-white/5 p-6 text-center text-gray-400">No hay sucursales registradas.</div>}
        </div>
      </section>
    </div>
  );

  const renderIngredients = () => (
    <div className="space-y-6">
      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-amber-300" />
          <h3 className="text-xl font-black text-white">Ingredientes</h3>
        </div>
        <form onSubmit={handleCreateIngredient} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-400">
              Nombre
              <input value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Tomate, queso, pan" />
            </label>
            <label className="block text-sm text-gray-400">
              Unidad
              <input value={ingredientUnit} onChange={(e) => setIngredientUnit(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
            </label>
          </div>
          <label className="block text-sm text-gray-400">
            Stock inicial
            <input value={initialStock} onChange={(e) => setInitialStock(e.target.value)} type="number" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
          </label>
          <button disabled={busy} className="rounded-[12px] bg-amber-500 px-4 py-2 font-black text-stone-900 transition hover:bg-amber-400 disabled:opacity-60">Guardar ingrediente</button>
        </form>
      </section>

      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-amber-300" />
          <h3 className="text-xl font-black text-white">Catálogo de ingredientes</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ingredients.map((ingredient) => (
            <div key={ingredient.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">{ingredient.name}</p>
              <p className="text-sm text-gray-400">Unidad: {ingredient.unit || 'unidad'}</p>
            </div>
          ))}
          {ingredients.length === 0 && <div className="rounded-[16px] border border-dashed border-white/10 bg-white/5 p-6 text-center text-gray-400">No hay ingredientes definidos.</div>}
        </div>
      </section>
    </div>
  );

  const renderPurchases = () => (
    <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <ArrowUpRight className="h-5 w-5 text-emerald-300" />
        <h3 className="text-xl font-black text-white">Registrar compras</h3>
      </div>
      <form onSubmit={handleRegisterPurchase} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-400">
            Sucursal
            <select value={branchId} onChange={(e) => { setBranchId(e.target.value); void loadInventory(e.target.value); }} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <label className="block text-sm text-gray-400">
            Ingrediente
            <select value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
              {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-400">
            Cantidad
            <input value={purchaseQty} onChange={(e) => setPurchaseQty(e.target.value)} type="number" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
          </label>
          <label className="block text-sm text-gray-400">
            Precio por unidad
            <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} type="number" step="0.01" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
          </label>
        </div>
        <button disabled={busy} className="rounded-[12px] bg-emerald-500 px-4 py-2 font-black text-white transition hover:bg-emerald-400 disabled:opacity-60">Registrar compra</button>
      </form>
    </section>
  );

  const renderAdjustments = () => (
    <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <ArrowDownLeft className="h-5 w-5 text-sky-300" />
        <h3 className="text-xl font-black text-white">Ajustar inventario</h3>
      </div>
      <form onSubmit={handleAdjustStock} className="space-y-4">
        <label className="block text-sm text-gray-400">
          Sucursal
          <select value={branchId} onChange={(e) => { setBranchId(e.target.value); void loadInventory(e.target.value); }} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </label>
        <label className="block text-sm text-gray-400">
          Ingrediente
          <select value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
            {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
          </select>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-400">
            Cambio de stock
            <input value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} type="number" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
          </label>
          <label className="block text-sm text-gray-400">
            Motivo
            <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
          </label>
        </div>
        <button disabled={busy} className="rounded-[12px] bg-sky-500 px-4 py-2 font-black text-white transition hover:bg-sky-400 disabled:opacity-60">Aplicar ajuste</button>
      </form>
    </section>
  );

  const renderAlerts = () => (
    <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-rose-300" />
        <h3 className="text-xl font-black text-white">Alertas</h3>
      </div>
      {alerts.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-white/10 bg-white/5 p-6 text-center text-gray-400">No hay alertas por el momento.</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.ingredient_id} className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-amber-400/30 hover:bg-white/8">
              <div>
                <p className="font-semibold text-white">{a.ingredient_name}</p>
                <p className="text-sm text-gray-400">{a.branch_name || 'Sucursal principal'}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-amber-200">{a.quantity}</p>
                <p className="text-xs text-gray-500">Mínimo {a.min_stock}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderCurrentSection = () => {
    switch (section) {
      case 'overview': return renderOverview();
      case 'inventory': return renderInventory();
      case 'users': return renderUsers();
      case 'branches': return renderBranches();
      case 'ingredients': return renderIngredients();
      case 'purchases': return renderPurchases();
      case 'adjustments': return renderAdjustments();
      case 'alerts': return renderAlerts();
      default: return renderOverview();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-[#070707] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="rounded-[24px] border border-white/10 bg-[#0b0b0b]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10 overflow-hidden">
                <img src="/werner-favicon.png" alt="Werner Burger logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">WERNER BURGER</p>
                <h1 className="text-3xl font-black text-white">Panel Administrativo</h1>
              </div>
            </div>
            <p className="max-w-xl text-sm text-gray-400">Selecciona una opción en el panel izquierdo y gestiona cada módulo de forma separada.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-white/10 bg-[#0b0b0b]/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <div className="mb-4 text-sm uppercase tracking-[0.28em] text-amber-300/70">Secciones</div>
            <div className="space-y-2">
              {SECTION_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = section === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSection(item.key)}
                    className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${active ? 'bg-amber-500/15 text-white shadow-glow-gold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="space-y-6">
            {renderCurrentSection()}
            {status && <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">{status}</div>}
          </main>
        </div>
      </div>
    </motion.div>
  );
}
