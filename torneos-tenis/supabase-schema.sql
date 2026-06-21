-- =============================================
-- TurneraTenis - Supabase Schema
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nombre text not null,
  apellido text not null,
  telefono text,
  numero_socio text unique,
  role text not null default 'socio' check (role in ('socio', 'admin')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuarios ven su propio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins ven todos los perfiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Usuarios actualizan su perfil" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins actualizan perfiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nombre, apellido)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', 'Socio'),
    coalesce(new.raw_user_meta_data->>'apellido', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- CANCHAS
-- =============================================
create table public.canchas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  tipo text not null default 'polvo_de_ladrillo' check (tipo in ('polvo_de_ladrillo', 'cemento', 'sintetico', 'pasto')),
  descripcion text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.canchas enable row level security;

create policy "Todos ven canchas activas" on public.canchas
  for select using (activa = true);

create policy "Admins gestionan canchas" on public.canchas
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Insert default courts
insert into public.canchas (nombre, tipo, descripcion) values
  ('Cancha 1', 'polvo_de_ladrillo', 'Cancha principal de polvo de ladrillo'),
  ('Cancha 2', 'polvo_de_ladrillo', 'Cancha lateral de polvo de ladrillo'),
  ('Cancha 3', 'cemento', 'Cancha de cemento cubierta');

-- =============================================
-- RESERVAS
-- =============================================
create table public.reservas (
  id uuid primary key default uuid_generate_v4(),
  cancha_id uuid references public.canchas on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  estado text not null default 'confirmada' check (estado in ('confirmada', 'cancelada', 'pendiente')),
  notas text,
  created_at timestamptz not null default now(),
  -- Prevent double booking
  constraint no_double_booking unique (cancha_id, fecha, hora_inicio)
);

alter table public.reservas enable row level security;

create policy "Socios ven sus reservas" on public.reservas
  for select using (auth.uid() = user_id);

create policy "Admins ven todas las reservas" on public.reservas
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Socios crean reservas" on public.reservas
  for insert with check (auth.uid() = user_id);

create policy "Socios cancelan sus reservas" on public.reservas
  for update using (auth.uid() = user_id);

create policy "Admins gestionan reservas" on public.reservas
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Function to check availability
create or replace function public.get_reservas_cancha(
  p_cancha_id uuid,
  p_fecha date
)
returns table (hora_inicio time, hora_fin time, estado text) as $$
begin
  return query
  select r.hora_inicio, r.hora_fin, r.estado
  from public.reservas r
  where r.cancha_id = p_cancha_id
    and r.fecha = p_fecha
    and r.estado != 'cancelada';
end;
$$ language plpgsql security definer;

-- =============================================
-- AUDIT LOG
-- =============================================
create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  tabla text not null,
  accion text not null check (accion in ('INSERT', 'UPDATE', 'DELETE')),
  user_id uuid references public.profiles(id) on delete set null,
  -- descripcion legible para mostrar en UI
  descripcion text,
  -- snapshot de los datos
  datos_antes jsonb,
  datos_despues jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- Solo admins pueden leer el audit log; nadie escribe directamente (lo hacen los triggers)
create policy "Admins leen audit log" on public.audit_log
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================
-- TRIGGER: auditar cambios en CANCHAS
-- =============================================
create or replace function public.audit_canchas()
returns trigger as $$
declare
  v_user_id uuid;
  v_descripcion text;
begin
  -- auth.uid() funciona dentro de triggers disparados por operaciones de usuario
  v_user_id := auth.uid();

  if TG_OP = 'INSERT' then
    v_descripcion := 'Cancha creada: ' || NEW.nombre;
    insert into public.audit_log (tabla, accion, user_id, descripcion, datos_antes, datos_despues)
    values ('canchas', 'INSERT', v_user_id, v_descripcion, null, to_jsonb(NEW));

  elsif TG_OP = 'UPDATE' then
    -- Detectar si cambió el campo activa (dar de alta/baja)
    if OLD.activa <> NEW.activa then
      if NEW.activa then
        v_descripcion := 'Cancha activada: ' || NEW.nombre;
      else
        v_descripcion := 'Cancha desactivada: ' || NEW.nombre;
      end if;
    else
      v_descripcion := 'Cancha modificada: ' || NEW.nombre;
    end if;
    insert into public.audit_log (tabla, accion, user_id, descripcion, datos_antes, datos_despues)
    values ('canchas', 'UPDATE', v_user_id, v_descripcion, to_jsonb(OLD), to_jsonb(NEW));

  elsif TG_OP = 'DELETE' then
    v_descripcion := 'Cancha eliminada: ' || OLD.nombre;
    insert into public.audit_log (tabla, accion, user_id, descripcion, datos_antes, datos_despues)
    values ('canchas', 'DELETE', v_user_id, v_descripcion, to_jsonb(OLD), null);
  end if;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger trg_audit_canchas
  after insert or update or delete on public.canchas
  for each row execute procedure public.audit_canchas();

-- =============================================
-- TRIGGER: auditar cambios en RESERVAS
-- =============================================
create or replace function public.audit_reservas()
returns trigger as $$
declare
  v_user_id uuid;
  v_descripcion text;
  v_cancha_nombre text;
begin
  v_user_id := auth.uid();

  -- Obtener nombre de la cancha para descripción legible
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    select nombre into v_cancha_nombre from public.canchas where id = NEW.cancha_id;
  else
    select nombre into v_cancha_nombre from public.canchas where id = OLD.cancha_id;
  end if;

  if TG_OP = 'INSERT' then
    v_descripcion := 'Reserva creada — ' || v_cancha_nombre
      || ' | ' || NEW.fecha::text
      || ' ' || to_char(NEW.hora_inicio, 'HH24:MI')
      || ' a ' || to_char(NEW.hora_fin, 'HH24:MI');
    insert into public.audit_log (tabla, accion, user_id, descripcion, datos_antes, datos_despues)
    values ('reservas', 'INSERT', v_user_id, v_descripcion, null, to_jsonb(NEW));

  elsif TG_OP = 'UPDATE' then
    if OLD.estado = 'confirmada' and NEW.estado = 'cancelada' then
      v_descripcion := 'Reserva cancelada — ' || v_cancha_nombre
        || ' | ' || NEW.fecha::text
        || ' ' || to_char(NEW.hora_inicio, 'HH24:MI')
        || ' a ' || to_char(NEW.hora_fin, 'HH24:MI');
    else
      v_descripcion := 'Reserva modificada — ' || v_cancha_nombre
        || ' | ' || NEW.fecha::text;
    end if;
    insert into public.audit_log (tabla, accion, user_id, descripcion, datos_antes, datos_despues)
    values ('reservas', 'UPDATE', v_user_id, v_descripcion, to_jsonb(OLD), to_jsonb(NEW));

  elsif TG_OP = 'DELETE' then
    v_descripcion := 'Reserva eliminada — ' || v_cancha_nombre
      || ' | ' || OLD.fecha::text;
    insert into public.audit_log (tabla, accion, user_id, descripcion, datos_antes, datos_despues)
    values ('reservas', 'DELETE', v_user_id, v_descripcion, to_jsonb(OLD), null);
  end if;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger trg_audit_reservas
  after insert or update or delete on public.reservas
  for each row execute procedure public.audit_reservas();
