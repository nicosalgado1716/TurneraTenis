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
