import { useState } from 'react';
import { Trash2, AlertTriangle, ShoppingBag, Receipt, History as HistoryIcon, Boxes } from 'lucide-react';
import { getCurrentProfile, supabase } from '../lib/supabase';
import { PrimaryButton, GhostButton, Banner, Modal } from './ui';

type Flags = {
  orders: boolean;
  purchases: boolean;
  movements: boolean;
  stock: boolean;
};

const OPTIONS: { key: keyof Flags; label: string; desc: string; icon: typeof ShoppingBag }[] = [
  { key: 'orders',    label: 'Pedidos y ventas',        desc: 'Borra todos los pedidos web y ventas en local (y sus productos). Elimina el "saldo recibido" de las pruebas.', icon: ShoppingBag },
  { key: 'purchases', label: 'Compras',                 desc: 'Borra el registro de compras al inventario central.', icon: Receipt },
  { key: 'movements', label: 'Historial de inventario', desc: 'Borra el historial de movimientos (compras, distribución, transferencias, consumos, ajustes).', icon: HistoryIcon },
  { key: 'stock',     label: 'Existencias en cero',     desc: 'Pone en cero todo el stock (central y por sucursal) y reinicia los costos.', icon: Boxes },
];

export default function ResetDatos() {
  const [flags, setFlags] = useState<Flags>({ orders: false, purchases: false, movements: false, stock: false });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const anySelected = Object.values(flags).some(Boolean);
  const toggle = (k: keyof Flags) => setFlags((f) => ({ ...f, [k]: !f[k] }));

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const profile = await getCurrentProfile();
      const ownerEmails = ['baex10@icloud.com', 'josecod10200205-'];
      const isOwner = Boolean(profile?.email && ownerEmails.some((email) => profile.email?.toLowerCase().trim() === email.toLowerCase().trim() || profile.email?.toLowerCase().includes('josecod10200205')));
      if (!isOwner) {
        throw new Error('Tu sesión no está autorizada como propietario para reiniciar datos.');
      }

      const rpcAttempt = await supabase.rpc('inv_reset_data', {
        p_orders: flags.orders,
        p_purchases: flags.purchases,
        p_movements: flags.movements,
        p_stock: flags.stock,
      });

      if (!rpcAttempt.error) {
        setMsg({ tone: 'ok', text: 'Listo. Los datos seleccionados se limpiaron correctamente.' });
        setFlags({ orders: false, purchases: false, movements: false, stock: false });
        return;
      }

      const rpcText = rpcAttempt.error.message || '';
      const fallbackNeeded = /function .*inv_reset_data|does not exist|not found|rpc/i.test(rpcText.toLowerCase());
      if (!fallbackNeeded) {
        throw rpcAttempt.error;
      }

      if (flags.orders) {
        await supabase.from('order_items').delete().not('id', 'is', 'null');
        await supabase.from('orders').delete().not('id', 'is', 'null');
      }
      if (flags.purchases) {
        await supabase.from('inv_purchases').delete().not('id', 'is', 'null');
      }
      if (flags.movements) {
        await supabase.from('inv_movements').delete().not('id', 'is', 'null');
      }
      if (flags.stock) {
        await supabase.from('inv_products').update({ central_qty: 0, avg_cost: 0, last_cost: 0 }).not('id', 'is', 'null');
        await supabase.from('inv_branch_stock').update({ qty: 0 }).not('id', 'is', 'null');
      }

      setMsg({ tone: 'ok', text: 'Listo. Los datos seleccionados se limpiaron correctamente.' });
      setFlags({ orders: false, purchases: false, movements: false, stock: false });
    } catch (e) {
      const text = e instanceof Error ? e.message : 'No se pudo completar el borrado.';
      const lowerText = text.toLowerCase();
      setMsg({ tone: 'err', text: lowerText.includes('propietario') || lowerText.includes('autorizada')
        ? 'Tu sesión no está autorizada como propietario para reiniciar datos.'
        : text });
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-white">Reiniciar datos</h2>
        <p className="mt-1 text-sm text-white/50">
          Borra los datos generados durante las pruebas. No afecta sucursales, usuarios, catálogo de productos, recetas ni el menú.
        </p>
      </div>

      <Banner tone="info">
        <span className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Esta acción es permanente: los datos seleccionados se eliminan y no se pueden recuperar.
        </span>
      </Banner>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const on = flags[o.key];
          return (
            <button
              key={o.key}
              onClick={() => toggle(o.key)}
              className={`flex items-start gap-3 rounded-[22px] border p-4 text-left transition-all ${
                on ? 'border-gold/60 bg-gold/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${on ? 'border-gold/50 bg-gold/15 text-gold-light' : 'border-white/10 bg-white/[0.05] text-white/60'}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-bold text-white">{o.label}</span>
                  <span className={`grid h-5 w-5 place-items-center rounded-md border text-[11px] ${on ? 'border-gold/60 bg-gold text-ink' : 'border-white/20 text-transparent'}`}>✓</span>
                </span>
                <span className="mt-1 block text-[12.5px] leading-snug text-white/50">{o.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {msg && <Banner tone={msg.tone === 'ok' ? 'ok' : 'err'}>{msg.text}</Banner>}

      <div className="flex items-center gap-3">
        <PrimaryButton
          onClick={() => setConfirmOpen(true)}
          disabled={!anySelected || busy}
          className="!bg-red-500 !text-white !shadow-none hover:!brightness-110"
        >
          <Trash2 className="h-4 w-4" /> Borrar lo seleccionado
        </PrimaryButton>
        <button
          onClick={() => setFlags({ orders: true, purchases: true, movements: true, stock: true })}
          className="text-sm font-bold text-white/50 underline-offset-4 hover:text-white hover:underline"
        >
          Seleccionar todo
        </button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => !busy && setConfirmOpen(false)}
        title="Confirmar borrado"
        footer={
          <>
            <GhostButton onClick={() => setConfirmOpen(false)} disabled={busy}>Cancelar</GhostButton>
            <PrimaryButton onClick={run} disabled={busy} className="!bg-red-500 !text-white !shadow-none">
              <Trash2 className="h-4 w-4" /> {busy ? 'Borrando…' : 'Sí, borrar'}
            </PrimaryButton>
          </>
        }
      >
        <p className="text-sm text-white/70">Se eliminará de forma permanente:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-white">
          {OPTIONS.filter((o) => flags[o.key]).map((o) => (
            <li key={o.key} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> {o.label}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-white/45">Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}
