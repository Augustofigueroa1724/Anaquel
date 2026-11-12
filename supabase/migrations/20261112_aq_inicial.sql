-- Anaquel · tablas aq_* en el proyecto Supabase `cratemates` (opción B, 12 nov 2026).
-- La autenticación (auth.users) se comparte con Crate Mates: no se toca ninguna tabla cm_*.

-- Perfil público dentro de la app: alias para que los amigos te encuentren.
create table if not exists public.aq_perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alias text not null unique check (alias ~ '^[a-z0-9_.]{3,20}$'),
  nombre text check (char_length(nombre) <= 60),
  creado timestamptz not null default now()
);

-- Cada libro del usuario. `datos` es el objeto Libro de la app (titulo, autor, notas…).
create table if not exists public.aq_libros (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id bigint not null,
  datos jsonb not null,
  actualizado timestamptz not null default now(),
  primary key (user_id, id)
);

-- Amistad: una solicitud pendiente que el otro acepta. Simétrica una vez aceptada.
create table if not exists public.aq_amistades (
  solicitante uuid not null references auth.users(id) on delete cascade,
  destinatario uuid not null references auth.users(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada')),
  creado timestamptz not null default now(),
  primary key (solicitante, destinatario),
  check (solicitante <> destinatario)
);

alter table public.aq_perfiles enable row level security;
alter table public.aq_libros enable row level security;
alter table public.aq_amistades enable row level security;

-- Perfiles: cualquiera con sesión los ve (solo alias y nombre); cada uno edita el suyo.
create policy aq_perfiles_ver on public.aq_perfiles for select to authenticated using (true);
create policy aq_perfiles_alta on public.aq_perfiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy aq_perfiles_editar on public.aq_perfiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Libros: solo los tuyos. Los amigos los ven por aq_anaquel_de (sin notas ni préstamos).
create policy aq_libros_propios on public.aq_libros for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Amistades: las ves si eres parte; pides tú; acepta el destinatario; cualquiera de los dos la borra.
create policy aq_amistades_ver on public.aq_amistades for select to authenticated
  using ((select auth.uid()) in (solicitante, destinatario));
create policy aq_amistades_pedir on public.aq_amistades for insert to authenticated
  with check (solicitante = (select auth.uid()) and estado = 'pendiente');
create policy aq_amistades_aceptar on public.aq_amistades for update to authenticated
  using (destinatario = (select auth.uid())) with check (destinatario = (select auth.uid()));
create policy aq_amistades_quitar on public.aq_amistades for delete to authenticated
  using ((select auth.uid()) in (solicitante, destinatario));

-- El anaquel de un amigo (amistad aceptada), sin notas ni préstamos.
create or replace function public.aq_anaquel_de(amigo uuid)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select l.datos - 'notas' - 'prestamo'
  from public.aq_libros l
  where l.user_id = amigo
    and exists (
      select 1 from public.aq_amistades a
      where a.estado = 'aceptada'
        and ((a.solicitante = auth.uid() and a.destinatario = amigo)
          or (a.destinatario = auth.uid() and a.solicitante = amigo))
    );
$$;

-- Borrar la cuenta de Anaquel (Apple lo exige). Borra todo lo aq_* del usuario y,
-- si no usa Crate Mates (sin fila activa en cm_users), también su usuario de auth.
create or replace function public.aq_borra_mi_cuenta()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
  usa_crate_mates boolean;
begin
  if yo is null then raise exception 'sin sesión'; end if;
  delete from public.aq_libros where user_id = yo;
  delete from public.aq_amistades where yo in (solicitante, destinatario);
  delete from public.aq_perfiles where user_id = yo;
  select exists (select 1 from public.cm_users where id = yo and deleted_at is null) into usa_crate_mates;
  if not usa_crate_mates then
    delete from auth.users where id = yo;
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.aq_anaquel_de(uuid) from public, anon;
revoke all on function public.aq_borra_mi_cuenta() from public, anon;
grant execute on function public.aq_anaquel_de(uuid) to authenticated;
grant execute on function public.aq_borra_mi_cuenta() to authenticated;
