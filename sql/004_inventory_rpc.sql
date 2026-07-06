-- RPC que incrementa inventario al registrar una compra
create or replace function increment_inventory_by_purchase(
  p_branch_id uuid,
  p_ingredient_id uuid,
  p_qty numeric,
  p_unit text,
  p_user_id uuid
) returns void as $$
begin
  -- Upsert en inventory
  loop
    update inventory set quantity = quantity + p_qty, updated_at = now() where branch_id = p_branch_id and ingredient_id = p_ingredient_id;
    if found then
      exit;
    end if;
    begin
      insert into inventory (id, branch_id, ingredient_id, quantity, unit, min_stock, updated_at) values (gen_random_uuid(), p_branch_id, p_ingredient_id, p_qty, p_unit, 0, now());
      exit;
    exception when unique_violation then
      -- concurrent insert, retry update
    end;
  end loop;

  -- Registrar movimiento
  insert into inventory_movements (id, branch_id, ingredient_id, change_qty, unit, type, reference_id, user_id, created_at)
  values (gen_random_uuid(), p_branch_id, p_ingredient_id, p_qty, p_unit, 'purchase', null, p_user_id, now());
end;
$$ language plpgsql;
