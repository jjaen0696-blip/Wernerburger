📋 INSTRUCCIONES PARA EJECUTAR LA MIGRACIÓN DE MENÚ EN SUPABASE

1. Abre tu proyecto de Supabase en: https://app.supabase.com
2. Ve a "SQL Editor" en el panel izquierdo
3. Haz clic en "New Query"
4. Copia y pega TODO el contenido del archivo: supabase/create_menu_table.sql
5. Haz clic en "Run" (o presiona Ctrl+Enter)
6. Espera a que se complete (deberías ver "✓ Éxito")

Si tienes errores:
- Si dice "already exists", primero elimina las tablas con:
  DROP TABLE IF EXISTS public.products CASCADE;
  DROP TABLE IF EXISTS public.categories CASCADE;
  Luego intenta de nuevo.

DESPUÉS de ejecutar la migración:
- La tabla "products" contendrá todos los productos del menú
- La tabla "categories" contendrá las categorías
- Los datos de ejemplo ya estarán insertados
- Puedes editarlos en la pestaña "Products" del panel admin

=====================================

La migración crea:
✓ Tabla de categorías (categories) con emojis e íconos
✓ Tabla de productos (products) con todas las propiedades
✓ Vista relacional para órdenes (orders_with_items)
✓ Triggers para actualizar automáticamente los timestamps
✓ Índices para mejorar performance
✓ 6 categorías con 14 productos de ejemplo

Después de ejecutar:
1. Vuelve a la aplicación
2. Ve al Panel Admin → Menú
3. Deberías ver todas las categorías con sus productos
4. Puedes editar, eliminar o agregar nuevos productos
5. Las imágenes se guardarán en Supabase Storage
