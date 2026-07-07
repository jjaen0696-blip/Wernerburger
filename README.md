# Werner Burger

Proyecto de plataforma de gestión de pedidos y administración de restaurante.

## Estructura

- `src/`: frontend React + TypeScript + Vite + Tailwind.
- `server/`: backend Node/Express con soporte local `local_db` y conexión a Supabase.
- `sql/`: migraciones y funciones SQL para Supabase.
- `scripts/`: scripts de seed y despliegue para Supabase.

## Comandos principales

### Frontend

```bash
npm install
npm run dev
```

### Backend local

```bash
cd server
npm install
$env:USE_LOCAL_SQLITE='1'
npm run dev
```

### Seed en Supabase

Revisa `scripts/README_SUPABASE.md` para los pasos exactos.

## Configuración GitHub

El repositorio se ha inicializado y empujado a `https://github.com/jjaen0696-blip/Wernerburger.git`.

## Despliegue

Este proyecto debe desplegarse como dos aplicaciones separadas:

- Frontend React/Vite en Vercel o Render Static Site.
- Backend Node/Express en Render Web Service separado.

### Estructura del repositorio

- `/` : frontend React/Vite.
- `/server` : backend Express + TypeScript.

### Frontend

El frontend vive en la raíz del repositorio y usa Vite. Para deploy en Vercel o Render Static Site, configura el build con el root del proyecto y el comando estándar de Vite.

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment variable sugerida:
  - `VITE_API_BASE=https://wernerburger.onrender.com`

### Backend

El backend reside en `server/` y debe desplegarse como un servicio web de Render.

- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

Variables de entorno requeridas para backend:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_KEY`
- `PORT` (opcional, por defecto 5174)

Este backend debe ejecutarse como Render Web Service, no como Render Static Site.

- No uses proxies temporales en Vercel.
- No desplegues el backend como Static Site.
- El frontend debe llamar directamente al backend en Render.

## Qué se agregó

- `scripts/seed_supabase.js` para insertar productos en Supabase.
- `scripts/seed_inventory.js` para crear sucursal, ingredientes, recetas y stock.
- `scripts/seed_sql_002.cjs` para reproducir el contenido de `sql/002_seed.sql`.
- `scripts/execute_sql_file.cjs` para ejecutar archivos SQL directamente en Postgres.
- `scripts/apply_sql_files.cjs` para aplicar el esquema completo y el seed con una sola orden.

## Notas de seguridad

- No compartas claves de Supabase en el chat.
- Usa `SUPABASE_SERVICE_ROLE_KEY` solo localmente para los scripts de seed.

## Variables de entorno para Vercel

- `VITE_API_BASE=https://tu-backend-en-render.onrender.com`
