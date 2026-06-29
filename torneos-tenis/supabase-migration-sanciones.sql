-- =============================================
-- TurneraTenis - Migración: Sanciones
-- Pegar y ejecutar en el SQL Editor de Supabase
-- =============================================

create table public.sanciones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  tipo text not null check (tipo in ('inhabilitacion_temporal', 'descuento_reservas')),
  motivo text not null,
  -- para inhabilitacion_temporal
  fecha_inicio date,
  fecha_fin date,
  -- para descuento_reservas
  cantidad_reservas int,
  estado text not null default 'activa' check (estado in ('activa', 'finalizada', 'revocada')),
  -- apelación del socio
  apelacion_texto text,
  apelacion_estado text not null default 'sin_apelar' check (apelacion_estado in ('sin_apelar', 'pendiente', 'aceptada', 'rechazada')),
  apelacion_respuesta text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.sanciones enable row level security;

create policy "Socios ven sus sanciones" on public.sanciones
  for select using (auth.uid() = user_id);

create policy "Admins ven todas las sanciones" on public.sanciones
  for select using (public.get_my_role() = 'admin');

create policy "Admins crean sanciones" on public.sanciones
  for insert with check (public.get_my_role() = 'admin');

create policy "Admins actualizan sanciones" on public.sanciones
  for update using (public.get_my_role() = 'admin');

-- El socio puede apelar su propia sanción (solo los campos de apelación se modifican desde la app)
create policy "Socios apelan sus sanciones" on public.sanciones
  for update using (auth.uid() = user_id);

-- =============================================
-- TRIGGER: auditar sanciones
-- =============================================
create or replace function public.audit_sanciones()
returns trigger as $$
declare
  v_user_id uuid;
  v_descripcion text;
  v_socio text;
begin
  v_user_id := auth.uid();

  if TG_OP = 'INSERT' then
    select nombre || ' ' || apellido into v_socio from public.profiles where id = NEW.user_id;
    if NEW.tipo = 'inhabilitacion_temporal' then
      v_descripcion := 'Sanción creada — inhabilitación de canchas a ' || v_socio
        || ' del ' || NEW.fecha_inicio::text || ' al ' || NEW.fecha_fin::text
        || ' | Motivo: ' || NEW.motivo;
    else
      v_descripcion := 'Sanción creada — descuento de ' || NEW.cantidad_reservas || ' reserva(s) a ' || v_socio
        || ' | Motivo: ' || NEW.motivo;
    end if;
    insert into public.audit_log (tabla, accion, user_id, descripcion, datos_antes, datos_despues)
    values ('sanciones', 'INSERT', v_user_id, v_descripcion, null, to_jsonb(NEW));

  elsif TG_OP = 'UPDATE' then
    select nombre || ' ' || apellido into v_socio from public.profiles where id = NEW.user_id;
    if OLD.apelacion_estado is distinct from NEW.apelacion_estado and NEW.apelacion_estado = 'pendiente' then
      v_descripcion := v_socio || ' apeló su sanción';
    elsif OLD.apelacion_estado is distinct from NEW.apelacion_estado and NEW.apelacion_estado in ('aceptada', 'rechazada') then
      v_descripcion := 'Apelación de ' || v_socio || ' ' || (case when NEW.apelacion_estado = 'aceptada' then 'aceptada' else 'rechazada' end);
    elsif OLD.estado is distinct from NEW.estado then
      v_descripcion := 'Sanción de ' || v_socio || ' actualizada: ' || NEW.estado;
    else
      v_descripcion := 'Sanción de ' || v_socio || ' modificada';
    end if;
    insert into public.audit_log (tabla, accion, user_id, descripcion, datos_antes, datos_despues)
    values ('sanciones', 'UPDATE', v_user_id, v_descripcion, to_jsonb(OLD), to_jsonb(NEW));
  end if;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger trg_audit_sanciones
  after insert or update on public.sanciones
  for each row execute procedure public.audit_sanciones();

-- =============================================
-- FUNCION: contar reservas usadas en el mes actual
-- =============================================
create or replace function public.reservas_usadas_mes(p_user_id uuid)
returns int as $$
  select count(*)::int
  from public.reservas
  where user_id = p_user_id
    and estado = 'confirmada'
    and date_trunc('month', fecha) = date_trunc('month', current_date);
$$ language sql security definer stable;

-- =============================================
-- FUNCION: descuento de reservas activo en el mes actual
-- =============================================
create or replace function public.descuento_reservas_mes(p_user_id uuid)
returns int as $$
  select coalesce(sum(cantidad_reservas), 0)::int
  from public.sanciones
  where user_id = p_user_id
    and tipo = 'descuento_reservas'
    and estado = 'activa'
    and date_trunc('month', created_at) = date_trunc('month', current_date);
$$ language sql security definer stable;

-- =============================================
-- FUNCION: ¿el socio tiene una inhabilitación activa para una fecha dada?
-- =============================================
create or replace function public.tiene_inhabilitacion(p_user_id uuid, p_fecha date)
returns boolean as $$
  select exists (
    select 1 from public.sanciones
    where user_id = p_user_id
      and tipo = 'inhabilitacion_temporal'
      and estado = 'activa'
      and p_fecha between fecha_inicio and fecha_fin
  );
$$ language sql security definer stable;
