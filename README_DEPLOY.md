Despliegue rápido (Render / Vercel)

Requisitos de entorno:
- `SUPABASE_URL` → URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` → Service role key (guardar en secreto)
- `ADMIN_API_KEY` → Clave secreta para proteger endpoints administrativos
- `VITE_API_BASE` → URL pública del servidor (ej. https://wernerburger.onrender.com)

Servidores:
- Backend (API) - desplegar carpeta `server/` con Node 18+ (Express). En Render, crea un "Web Service" apuntando al repo y configura `start` como `node server/index.mjs` o usa `npm run start:server`.
- Frontend - desplegar con Vite en Vercel/Render; asegúrate de configurar `VITE_API_BASE` en las variables de despliegue.

Pasos (Render):
1. Conecta el repo en Render.
2. Crea un nuevo service para el backend: build command `npm ci` y start command `npm run start:server`.
   - No uses `npm start`, ya que ese script sirve la build de Vite y no ejecuta el backend Express.
3. Añade variables de entorno en Render: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY`, `PORT`.
4. Despliega y copia la URL pública para `VITE_API_BASE` en las settings del Frontend service.

Pasos (Vercel) para frontend:
1. Conecta el repo en Vercel.
2. Asegura que la variable `VITE_API_BASE` apunte al backend desplegado.
3. Despliega.

Seguridad:
- Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en el cliente.
- Usa `ADMIN_API_KEY` o verificación de JWT para proteger endpoints de creación/edición.

GitHub Actions (CI/CD)
----------------------

Este repo incluye dos workflows en `.github/workflows/`:

- `deploy-backend.yml`: al hacer push a `main` dispara un deploy a Render usando la API (`RENDER_API_KEY` y `RENDER_SERVICE_ID`).
- `deploy-frontend.yml`: al hacer push a `main` construye el frontend y despliega usando Vercel CLI (`VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`).

Secrets requeridos en GitHub:

- `RENDER_API_KEY` — API key de Render
- `RENDER_SERVICE_ID` — ID del servicio en Render
- `VERCEL_TOKEN` — token de Vercel
- `VERCEL_PROJECT_ID` — id del proyecto en Vercel
- `VERCEL_ORG_ID` — id de la organización en Vercel
- `SUPABASE_URL` — URL de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — service role key de Supabase (guardar en secreto)

Procedimiento:

1. Añade los secrets anteriores en el repo GitHub (Settings → Secrets).
2. Asegúrate de que `VITE_API_BASE` en el entorno de Vercel apunte al backend desplegado.
3. Haz push a `main` para activar los workflows.

Nota: los workflows están diseñados para fallar silenciosamente si faltan secrets, para evitar despliegues accidentales desde forks.

Siguiente: puedo actualizar `src/pages/Admin.tsx` para apuntar explícitamente a la URL desplegada en `VITE_API_BASE` si quieres, y añadir un pequeño README con pasos para crear usuarios en Supabase vía el endpoint `/users`.
