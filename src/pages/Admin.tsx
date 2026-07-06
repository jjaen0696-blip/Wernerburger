import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, PackageCheck, PlusCircle, Store, TrendingUp, Users, Warehouse } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://127.0.0.1:5174' : 'https://wernerburger.onrender.com');
const api = (path: string) => `${API_BASE}${path}`;

interface Branch { id: string; name: string; address?: string; is_closed?: boolean; }
interface Ingredient { id: string; name: string; unit?: string | null; }
interface InventoryItem { id: string; branch_id: string; ingredient_id: string; qty: number; unit?: string | null; ingredient_name?: string; updated_at?: string; }
interface UserRecord { id: string; username: string; email?: string; branch_id?: string | null; role?: 'admin' | 'manager' | 'kitchen' | 'delivery'; }

export default function Admin() {
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
      const [branchesRes, ingredientsRes, alertsRes, summaryRes, usersRes] = await Promise.all([
        fetch(api('/branches')),
        fetch(api('/ingredients')),
        fetch(api('/alerts')),
        fetch(api('/reports/sales-summary')),
        fetch(api('/users')),
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
      const method = editingBranchId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[18px] border border-amber-400/15 bg-white/8 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Ventas del periodo</p>
              <p className="mt-2 text-2xl font-black text-amber-200">${totalSales.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-amber-400/15 p-3 text-amber-300"><TrendingUp className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-[18px] border border-amber-400/15 bg-white/8 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Alertas activas</p>
              <p className="mt-2 text-2xl font-black text-white">{alerts.length}</p>
            </div>
            <div className="rounded-2xl bg-rose-400/15 p-3 text-rose-300"><AlertTriangle className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-[18px] border border-amber-400/15 bg-white/8 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pedidos registrados</p>
              <p className="mt-2 text-2xl font-black text-white">{totalOrders}</p>
            </div>
            <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300"><PackageCheck className="h-5 w-5" /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Inventario</p>
              <h3 className="text-xl font-black text-white">Control operativo del stock</h3>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">Activo</div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-400">
              Sucursal
              <select value={branchId} onChange={(e) => { setBranchId(e.target.value); void loadData(e.target.value); }} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-400">
              Ingrediente
              <select value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
              </select>
            </label>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-white/10">
            <table className="min-w-full text-sm">
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
          </div>
        </section>

        <section className="space-y-4">
          <form onSubmit={handleCreateUser} className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-300" />
              <h3 className="text-lg font-black text-white">Crear usuario</h3>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-400">
                Usuario
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="usuario" />
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
              <label className="block text-sm text-gray-400">
                Correo
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="correo@dominio.com" />
              </label>
              <label className="block text-sm text-gray-400">
                Contraseña
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
              </label>
              <label className="block text-sm text-gray-400">
                Sucursal asignada
                <select value={userBranchId} onChange={(e) => setUserBranchId(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white">
                  <option value="">Sin sucursal</option>
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </label>
              <button disabled={busy} className="w-full rounded-[12px] bg-amber-500 px-3 py-2 font-black text-stone-900 transition hover:bg-amber-400 disabled:opacity-60">Crear usuario</button>
            </div>
          </form>

          <form onSubmit={handleCreateBranch} className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-300" />
              <h3 className="text-lg font-black text-white">Crear sucursal</h3>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-400">
                Nombre
                <input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Sucursal Norte" />
              </label>
              <label className="block text-sm text-gray-400">
                Dirección
                <input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Av. Central 123" />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" checked={branchClosed} onChange={(e) => setBranchClosed(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black/40" />
                Marcar como cerrada por hoy
              </label>
              <button disabled={busy} className="w-full rounded-[12px] bg-emerald-500 px-3 py-2 font-black text-white transition hover:bg-emerald-400 disabled:opacity-60">{editingBranchId ? 'Actualizar sucursal' : 'Guardar sucursal'}</button>
            </div>
          </form>

          <div className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-300" />
              <h3 className="text-lg font-black text-white">Sucursales</h3>
            </div>
            <div className="space-y-2">
              {branches.map((branch) => (
                <div key={branch.id} className={`flex items-center justify-between rounded-[14px] border px-3 py-3 ${branch.is_closed ? 'border-rose-500/20 bg-rose-500/10' : 'border-white/10 bg-white/5'}`}>
                  <div>
                    <p className="font-semibold text-white">{branch.name}</p>
                    <p className="text-sm text-gray-400">{branch.address || 'Sin dirección'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {branch.is_closed && <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200">Cerrado</span>}
                    <button onClick={() => startEditBranch(branch)} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-200 transition hover:bg-white/10">Editar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateIngredient} className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-amber-300" />
              <h3 className="text-lg font-black text-white">Crear ingrediente</h3>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-400">
                Nombre
                <input value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" placeholder="Tomate, queso, pan" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-gray-400">
                  Unidad
                  <input value={ingredientUnit} onChange={(e) => setIngredientUnit(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
                </label>
                <label className="block text-sm text-gray-400">
                  Stock inicial
                  <input value={initialStock} onChange={(e) => setInitialStock(e.target.value)} type="number" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
                </label>
              </div>
              <button disabled={busy} className="w-full rounded-[12px] bg-amber-500 px-3 py-2 font-black text-stone-900 transition hover:bg-amber-400 disabled:opacity-60">Guardar ingrediente</button>
            </div>
          </form>

          <form onSubmit={handleRegisterPurchase} className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-300" />
              <h3 className="text-lg font-black text-white">Registrar entrada de stock</h3>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-400">
                Cantidad
                <input value={purchaseQty} onChange={(e) => setPurchaseQty(e.target.value)} type="number" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
              </label>
              <label className="block text-sm text-gray-400">
                Precio por unidad
                <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} type="number" step="0.01" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
              </label>
              <button disabled={busy} className="w-full rounded-[12px] bg-emerald-500 px-3 py-2 font-black text-white transition hover:bg-emerald-400 disabled:opacity-60">Registrar compra</button>
            </div>
          </form>

          <form onSubmit={handleAdjustStock} className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-sky-300" />
              <h3 className="text-lg font-black text-white">Ajustar inventario</h3>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-400">
                Cambio de stock
                <input value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} type="number" className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
              </label>
              <label className="block text-sm text-gray-400">
                Motivo
                <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="mt-1 w-full rounded-[12px] border border-white/10 bg-black/40 px-3 py-2 text-white" />
              </label>
              <button disabled={busy} className="w-full rounded-[12px] bg-sky-500 px-3 py-2 font-black text-white transition hover:bg-sky-400 disabled:opacity-60">Aplicar ajuste</button>
            </div>
          </form>

          {status && <div className="rounded-[16px] border border-white/10 bg-white/5 px-3 py-3 text-sm text-gray-300">{status}</div>}
        </section>
      </div>

      <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Alertas</p>
            <h3 className="text-xl font-black text-white">Inventario y stock crítico</h3>
          </div>
          <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">Tiempo real</div>
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
    </motion.div>
  );
}
