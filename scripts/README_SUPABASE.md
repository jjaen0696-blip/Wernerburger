Instrucciones para desplegar esquema y seed en Supabase

1) ROTAR LA CLAVE
- Si pegaste una clave en la conversación, gírala ahora en el panel de Supabase (Security -> API -> Service role key). No compartas claves aquí.

2) Ejecutar SQL (migraciones)
- Abre el panel SQL Editor en tu proyecto Supabase (https://<tu-proyecto>.supabase.co/sql)
- Copia y pega el contenido de los archivos `sql/001_schema.sql`, `sql/003_triggers.sql`, `sql/004_inventory_rpc.sql`, `sql/005_purchase_trigger.sql`, `sql/006_alerts.sql`, `sql/008_rls.sql` en ese orden y ejecútalos.

Alternativa (CLI):
- Instala `supabase` CLI y configura `supabase login`/`supabase link` y usa `supabase db push` si tienes migraciones.

3) Seed de ejemplo (menú)
- Exporta tu `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el terminal y ejecuta:

```
cd scripts
npm install @supabase/supabase-js
# Exporta tus variables y ejecuta (no pegues la clave en un chat):
# SUPABASE_URL=https://<tu-proyecto>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE> node seed_supabase.js
```

4) Verificación
- En Supabase Studio revisa la tabla `products` y confirma que los elementos se insertaron.

Si quieres, puedo generar un script adicional para insertar `ingredients`, `recipes` e `inventory` desde `sql/002_seed.sql` automáticamente (requiere que el esquema ya exista). Dime si lo deseas.

5) Ejecutar SQL directamente desde el archivo
- He añadido `scripts/execute_sql_file.cjs` para ejecutar cualquier archivo SQL contra tu base de datos Postgres.
- Ejecuta:

```
cd scripts
npm install @supabase/supabase-js pg
# DATABASE_URL='postgres://user:pass@host:5432/dbname' node execute_sql_file.cjs ../sql/002_seed.sql
```

Notas:
- Usa `DATABASE_URL` o `SUPABASE_DB_URL` para conectar a Postgres.
- El script no depende de Supabase JS directamente para ejecutar SQL, solo usa `pg`.

5) Seed de inventario, recetas e ingredientes (script automático)
- He añadido `scripts/seed_inventory.js` que crea una sucursal de ejemplo, inserta ingredientes base, crea recetas para los productos en `scripts/menuData.json` y deja inventario inicial.
- Ejecuta:

```
cd scripts
npm install @supabase/supabase-js
# SUPABASE_URL=https://<tu-proyecto>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE> node seed_inventory.js
```

Notas:
- El script requiere `SUPABASE_SERVICE_ROLE_KEY` (clave Service Role). Ejecútalo localmente y no compartas la clave.
- El script hace upsert de `products` usando los IDs presentes en `scripts/menuData.json`.

6) Seed exacto de sql/002_seed.sql
- He añadido `scripts/seed_sql_002.cjs` que reproduce los registros de `sql/002_seed.sql` en Supabase.
- Ejecuta:

```
cd scripts
npm install @supabase/supabase-js
# SUPABASE_URL=https://<tu-proyecto>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE> node seed_sql_002.cjs
```

Notas:
- Usa `SUPABASE_SERVICE_ROLE_KEY` porque el script crea y actualiza datos administrativos.
- Revisa las tablas `branches`, `roles`, `permissions`, `role_permissions`, `users`, `ingredients`, `products`, `recipes`, `recipe_items`, `inventory`.
