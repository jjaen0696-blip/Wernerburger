📋 PASOS FINALES PARA ACTIVAR TODAS LAS FUNCIONES

==================================
PASO 1: EJECUTAR MIGRACIÓN SQL (IMPORTANTE ⚠️)
==================================

1. Abre tu proyecto Supabase: https://app.supabase.com
2. Ve a "SQL Editor" (panel izquierdo)
3. Haz clic en "+ New Query"
4. Copia TODO el contenido de: supabase/create_menu_table.sql
5. Pégalo en el editor SQL
6. Presiona: "Run" (Ctrl+Enter)
7. Espera a ver: "✓ Success"

IMPORTANTE: Si ves error de "already exists", ejecuta primero:
```sql
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
```
Luego intenta de nuevo con el archivo completo.

==================================
PASO 2: CONFIGURAR SUPABASE STORAGE
==================================

1. Ve a "Storage" en tu proyecto Supabase
2. Crea un "New Bucket" llamado: products
3. Haz clic en "products" → Settings
4. Activa "Public bucket" (permitir acceso público)
5. En "Access Control", asegúrate que permite subir archivos

==================================
PASO 3: USAR LA APLICACIÓN
==================================

**En el Panel Admin:**
- Ve a "Menú" → verás todas las categorías
- Haz clic en "Agregar Producto" para crear nuevos productos
- Puedes: Editar, Eliminar, y Subir Imágenes
- Los cambios aparecen en tiempo real en el menú cliente

**En el Menú Cliente:**
- Los productos se cargan automáticamente desde Supabase
- Si hay conexión, usará los datos de Supabase
- Si no hay conexión, usará datos de respaldo locales

**Para Crear Órdenes:**
1. Selecciona productos del menú
2. Haz clic en el botón flotante con cantidad y precio
3. Elige: Recoger en tienda O Entregar a domicilio
4. Completa nombre, teléfono y dirección
5. Elige método de pago (Efectivo o Yappy)
6. La orden aparece en Cocina y Delivery en tiempo real

==================================
PASO 4: VERIFICAR ROLES Y ACCESO
==================================

Usuarios de prueba creados:
- Email: admin@wernerburger.com → Panel Admin + Dashboard
- Email: cocina@wernerburger.com → Interfaz Cocina (recibe órdenes)
- Email: delivery@wernerburger.com → Interfaz Delivery (recibe entregas)

Contraseña de prueba: password123

==================================
QUÉ FUNCIONA AHORA ✅
==================================

✅ Autenticación por usuario (no email)
✅ Sistema de roles (Admin/Cocina/Delivery)
✅ Redirects automáticos por rol
✅ Panel Admin con Dashboard
✅ Gestión completa del Menú:
   - Crear productos
   - Editar productos
   - Subir imágenes
   - Eliminar productos
   - Organizar por categorías
✅ Menú cliente dinámico desde Supabase
✅ Carrito de compras
✅ Checkout con opciones de entrega
✅ Crear órdenes automáticamente en Supabase
✅ Interfaz Cocina en tiempo real
✅ Interfaz Delivery en tiempo real
✅ Transiciones de estado de órdenes

==================================
PRÓXIMOS PASOS (Opcional)
==================================

Si quieres mejorar más:
1. Panel de Usuarios - CRUD completo en admin
2. Reportes y Analytics
3. Sistema de notificaciones en tiempo real
4. Historial de órdenes completadas
5. Exportar reportes en PDF

==================================
⚠️ IMPORTANTE: PERMISOS DE SUPABASE
==================================

Si las órdenes no se crean, verifica:

1. RLS (Row Level Security) en tabla 'orders':
   - La tabla debe permitir INSERT para usuarios autenticados
   - O desactivar RLS en desarrollo:
   
   ```sql
   ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
   ```

2. RLS en tabla 'products':
   - Debe permitir SELECT público (anonimo puede leer)
   - RLS debe permitir que el admin inserte/actualice

==================================
¿PROBLEMAS?
==================================

1. "usuario no encontrado" → Verifica que el usuario existe en tabla 'users'
2. Órdenes no aparecen en Cocina → Revisa que branch_id esté correcto
3. Imágenes no se suben → Verifica que el bucket 'products' está público
4. Menú vacío → Asegúrate de haber ejecutado la migración SQL

Contacta al soporte si hay más problemas.
