import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Boxes, PackageCheck, TrendingUp, Warehouse } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://wernerburger.onrender.com';
const api = (path: string) => `${API_BASE}${path}`;

export default function Admin() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    fetch(api('/alerts')).then(r => r.json()).then(setAlerts).catch(() => setAlerts([]));
    fetch(api('/reports/sales-summary')).then(r => r.json()).then(setSummary).catch(() => setSummary([]));
  }, []);

  const totalSales = summary.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalOrders = summary.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

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

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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

        <section className="rounded-[22px] border border-white/10 bg-[#0f0c09]/85 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-amber-300/70">Resumen</p>
              <h3 className="text-xl font-black text-white">Ventas por sucursal</h3>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">Actualizado</div>
          </div>
          {summary.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-white/10 bg-white/5 p-6 text-center text-gray-400">Sin datos disponibles.</div>
          ) : (
            <div className="space-y-3">
              {summary.map((s) => (
                <div key={s.branch_id} className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-amber-400/30 hover:bg-white/8">
                  <div>
                    <p className="font-semibold text-white">{s.branch_id}</p>
                    <p className="text-sm text-gray-400">{s.count} pedidos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-amber-200">${Number(s.total || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Rendimiento</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
