import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, Shield, UserCog, UserPlus, Mail, KeyRound, Check, Store } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey, type Location, type Role } from '../lib/supabase';
import { Modal, Field, TextInput, SelectInput, PrimaryButton, GhostButton, Pill, Spinner, EmptyState, Banner } from './ui';

type AdminUser = { id: string; email: string | null; role: Role; location_id: string | null; created_at: string };

export default function Usuarios({ currentEmail }: { currentEmail: string | null }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de edición de rol
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<Role>('encargado');
  const [editLoc, setEditLoc] = useState<string>('');
  const [savingRole, setSavingRole] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  // Modal de creación
  const [createOpen, setCreateOpen] = useState(false);
  const [nEmail, setNEmail] = useState('');
  const [nPass, setNPass] = useState('');
  const [nRole, setNRole] = useState<Role>('encargado');
  const [nLoc, setNLoc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ tone: 'ok' | 'err' | 'info'; text: string } | null>(null);

  const load = useCallback(async () => {
    const [{ data: us, error: uErr }, { data: locs }] = await Promise.all([
      supabase.rpc('admin_list_users'),
      supabase.from('locations').select('*').eq('is_active', true).order('name'),
    ]);
    if (uErr) setError(uErr.message);
    else setUsers((us ?? []) as AdminUser[]);
    setLocations(locs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const locName = (id: string | null) => locations.find((l) => l.id === id)?.name ?? '—';

  const openEdit = (u: AdminUser) => {
    setEditing(u); setEditRole(u.role); setEditLoc(u.location_id ?? ''); setEditMsg(null);
  };

  const saveRole = async () => {
    if (!editing?.email) return;
    if (editRole === 'encargado' && !editLoc) { setEditMsg('Selecciona la sucursal del encargado.'); return; }
    setSavingRole(true); setEditMsg(null);
    const { error } = await supabase.rpc('admin_set_user_role', {
      p_email: editing.email,
      p_role: editRole,
      p_location_id: editRole === 'encargado' ? editLoc : null,
    });
    setSavingRole(false);
    if (error) { setEditMsg(error.message); return; }
    setEditing(null);
    load();
  };

  const createUser = async () => {
    const email = nEmail.trim();
    if (!email || nPass.length < 6) { setCreateMsg({ tone: 'err', text: 'Correo válido y contraseña de al menos 6 caracteres.' }); return; }
    if (nRole === 'encargado' && !nLoc) { setCreateMsg({ tone: 'err', text: 'Selecciona la sucursal del encargado.' }); return; }
    setCreating(true); setCreateMsg(null);
    try {
      // Cliente aislado: no toca la sesión del admin actual.
      const tmp = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await tmp.auth.signUp({ email, password: nPass });
      if (error) throw error;
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setCreateMsg({ tone: 'err', text: 'Ese correo ya está registrado.' });
        setCreating(false);
        return;
      }
      // Asignar rol/sucursal (el perfil lo crea el trigger al registrarse).
      const { error: roleErr } = await supabase.rpc('admin_set_user_role', {
        p_email: email, p_role: nRole, p_location_id: nRole === 'encargado' ? nLoc : null,
      });
      if (roleErr) {
        setCreateMsg({ tone: 'info', text: `Usuario creado, pero no se pudo asignar el rol todavía (${roleErr.message}). Asígnalo desde la lista.` });
      } else {
        setCreateMsg({ tone: 'ok', text: `Usuario ${email} creado como ${nRole}.` });
      }
      setNEmail(''); setNPass(''); setNRole('encargado'); setNLoc('');
      load();
    } catch (err) {
      setCreateMsg({ tone: 'err', text: err instanceof Error ? err.message : 'No se pudo crear el usuario.' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            <Users className="h-6 w-6 text-gold" /> Usuarios y roles
          </h2>
          <p className="mt-1 text-[13px] text-white/45">El admin gestiona todo; cada encargado solo su sucursal.</p>
        </div>
        <PrimaryButton onClick={() => { setCreateMsg(null); setCreateOpen(true); }}>
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </PrimaryButton>
      </div>

      {error && <div className="mb-4"><Banner tone="err">⚠️ {error}</Banner></div>}

      {loading ? (
        <Spinner label="Cargando usuarios…" />
      ) : users.length === 0 ? (
        <EmptyState title="Sin usuarios" subtitle="Crea el primer usuario del panel." icon={<Users className="h-6 w-6" />} />
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-white/10 bg-ink-800/70 shadow-soft">
          {users.map((u, i) => (
            <div key={u.id} className={`flex flex-wrap items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-white/8' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-bold text-white">
                  <Mail className="h-4 w-4 text-white/40" />
                  <span className="line-clamp-1">{u.email}</span>
                  {currentEmail && u.email?.toLowerCase() === currentEmail.toLowerCase() && (
                    <span className="text-[11px] font-bold text-gold">(tú)</span>
                  )}
                </p>
              </div>
              {u.role === 'admin'
                ? <Pill tone="gold"><Shield className="h-3 w-3" /> Admin</Pill>
                : <Pill tone="green"><Store className="h-3 w-3" /> {locName(u.location_id)}</Pill>}
              <GhostButton onClick={() => openEdit(u)} className="!px-3 !py-2 text-[13px]">
                <UserCog className="h-3.5 w-3.5" /> Cambiar rol
              </GhostButton>
            </div>
          ))}
        </div>
      )}

      {/* Editar rol */}
      <Modal
        open={!!editing}
        onClose={() => !savingRole && setEditing(null)}
        title="Cambiar rol"
        footer={
          <>
            <GhostButton onClick={() => !savingRole && setEditing(null)} disabled={savingRole}>Cancelar</GhostButton>
            <PrimaryButton onClick={saveRole} disabled={savingRole}>{savingRole ? 'Guardando…' : (<><Check className="h-4 w-4" strokeWidth={3} /> Guardar</>)}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {editMsg && <Banner tone="err">⚠️ {editMsg}</Banner>}
          <p className="text-sm text-white/60">{editing?.email}</p>
          <Field label="Rol">
            <SelectInput value={editRole} onChange={(e) => setEditRole(e.target.value as Role)} disabled={savingRole}>
              <option value="encargado" className="bg-ink-800">Encargado (una sucursal)</option>
              <option value="admin" className="bg-ink-800">Administrador (todo)</option>
            </SelectInput>
          </Field>
          {editRole === 'encargado' && (
            <Field label="Sucursal asignada">
              <SelectInput value={editLoc} onChange={(e) => setEditLoc(e.target.value)} disabled={savingRole}>
                <option value="" className="bg-ink-800">Selecciona…</option>
                {locations.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
              </SelectInput>
            </Field>
          )}
        </div>
      </Modal>

      {/* Crear usuario */}
      <Modal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="Nuevo usuario"
        footer={
          <>
            <GhostButton onClick={() => !creating && setCreateOpen(false)} disabled={creating}>Cerrar</GhostButton>
            <PrimaryButton onClick={createUser} disabled={creating}>{creating ? 'Creando…' : (<><UserPlus className="h-4 w-4" /> Crear</>)}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {createMsg && <Banner tone={createMsg.tone}>{createMsg.tone === 'ok' ? '✅ ' : createMsg.tone === 'info' ? 'ℹ️ ' : '⚠️ '}{createMsg.text}</Banner>}
          <Field label="Correo">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
              <TextInput type="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} placeholder="empleado@correo.com" autoComplete="off" className="pl-12" disabled={creating} />
            </div>
          </Field>
          <Field label="Contraseña" hint="Mínimo 6 caracteres.">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
              <TextInput type="text" value={nPass} onChange={(e) => setNPass(e.target.value)} placeholder="••••••" autoComplete="off" className="pl-12" disabled={creating} />
            </div>
          </Field>
          <Field label="Rol">
            <SelectInput value={nRole} onChange={(e) => setNRole(e.target.value as Role)} disabled={creating}>
              <option value="encargado" className="bg-ink-800">Encargado (una sucursal)</option>
              <option value="admin" className="bg-ink-800">Administrador (todo)</option>
            </SelectInput>
          </Field>
          {nRole === 'encargado' && (
            <Field label="Sucursal asignada">
              <SelectInput value={nLoc} onChange={(e) => setNLoc(e.target.value)} disabled={creating}>
                <option value="" className="bg-ink-800">Selecciona…</option>
                {locations.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
              </SelectInput>
            </Field>
          )}
        </div>
      </Modal>
    </div>
  );
}
