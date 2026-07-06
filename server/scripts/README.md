Importar `server/data/local_db.json` a Supabase

Requisitos:
- Node 18+
- Clave de servicio de Supabase (service_role) y URL del proyecto

Instalación:

```bash
cd server
npm install @supabase/supabase-js dotenv
```

Uso (desde `server`):

```bash
# Exporta variables de entorno (Windows PowerShell):
$env:SUPABASE_URL = "https://<tu-proyecto>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<tu_service_role_key>"

# Ejecutar import
node scripts/import_local_db_to_supabase.js
```

Notas:
- El script hará `upsert` por `id` o `username` (para `users`).
- Revisa `server/scripts/import_local_db_to_supabase.sql` si prefieres ejecutar SQL directo.
- Si usas RLS en Supabase, asegúrate de ejecutar el script con la `service_role`.
