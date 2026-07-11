# Migración de Tabla Menu Items

Para crear la tabla `menu_items` en Supabase:

## Opción 1: SQL Editor de Supabase (RECOMENDADO)

1. Ve a: https://app.supabase.com/project/yelkwbdxncitagmnnxat/sql/new
2. Copia y ejecuta el contenido de: `supabase/migrations/20260711_menu_items_table.sql`

## Opción 2: CLI de Supabase (Si lo tienes instalado)

```bash
supabase db push
```

## Verificar que funciona

Después de ejecutar la migración, verifica en Supabase:
- Table: `public.menu_items` debe existir
- Debe haber ~14 productos iniciales

## Lo que se creó

- Tabla `menu_items` con campos completos
- Índices para performance
- Trigger para auto-actualizar timestamps
- Realtime habilitado para actualizaciones en tiempo real
- 14 productos iniciales de Wernerburger

## Siguiente paso

Una vez creada la tabla, Menu.tsx leerá automáticamente de Supabase
