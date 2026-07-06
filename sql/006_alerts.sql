-- Vista para detectar ingredientes con stock bajo o agotados
create view low_stock_alerts as
select inv.branch_id, b.name as branch_name, inv.ingredient_id, ing.name as ingredient_name, inv.quantity, inv.min_stock,
  case when inv.quantity <= 0 then 'out' when inv.quantity <= inv.min_stock then 'low' else 'ok' end as level
from inventory inv
join ingredients ing on ing.id = inv.ingredient_id
left join branches b on b.id = inv.branch_id
where inv.quantity <= inv.min_stock or inv.quantity <= 0;

-- Función para obtener alertas resumidas
create or replace function get_alerts() returns table(branch_id uuid, branch_name text, ingredient_id uuid, ingredient_name text, quantity numeric, min_stock numeric, level text) as $$
begin
  return query select * from low_stock_alerts order by branch_name, level desc;
end;
$$ language plpgsql;
