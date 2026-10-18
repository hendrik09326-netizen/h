-- =========================================================
--  PORTFOLIO — skema database Supabase
--  Jalankan seluruh file ini di Supabase → SQL Editor → Run.
--  GANTI email di bagian "ADMIN" dengan email akun admin kamu.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- ADMIN ----------
create table if not exists public.admin_emails (
  email text primary key
);

-- >>> GANTI dengan email kamu <<<
insert into public.admin_emails (email) values ('kamu@email.com')
on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- PROFIL (satu baris) ----------
create table if not exists public.profile (
  id int primary key default 1 check (id = 1),
  name text not null default 'Nama Kamu',
  role text default 'Designer & Content Creator',
  rotating_words text[] default array['Graphic Designer','UI Designer','Content Creator','Web Developer'],
  headline text default 'Saya merancang visual dan pengalaman digital yang terasa jelas, hidup, dan mudah diingat.',
  bio text default 'Tulis cerita singkat tentang dirimu di sini lewat dashboard.',
  photo_url text,
  location text default 'Yogyakarta, Indonesia',
  email text,
  whatsapp text,
  instagram text,
  tiktok text,
  youtube text,
  linkedin text,
  github text,
  cv_url text,
  available boolean default true,
  accent_color text default '#ff6a3d',
  updated_at timestamptz default now()
);
insert into public.profile (id) values (1) on conflict do nothing;

-- ---------- BIDANG / KEAHLIAN ----------
create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- SEKSI (kategori karya) ----------
-- layout: 'carousel' (galeri berjalan), 'grid', 'video' (thumbnail video), 'website' (mockup browser)
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  layout text not null default 'carousel'
    check (layout in ('carousel','grid','video','website')),
  sort_order int default 0,
  visible boolean default true,
  created_at timestamptz default now()
);

-- ---------- KARYA ----------
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  link text,
  meta text,          -- contoh: "2026 · 120K views" atau "Client: BOXA.YK"
  tags text[] default '{}',
  featured boolean default false,
  visible boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists works_section_idx on public.works(section_id, sort_order);

-- ---------- DATA AWAL ----------
insert into public.fields (title, description, sort_order)
select * from (values
  ('Graphic Design', 'Feed Instagram, poster, identitas visual, dan materi promosi.', 1),
  ('UI / UX Design', 'Antarmuka aplikasi dan website yang rapi dan mudah dipakai.', 2),
  ('Content Creation', 'Konsep, produksi, dan editing video pendek untuk media sosial.', 3),
  ('Web Development', 'Website modern dengan Next.js dan Supabase.', 4)
) v(title, description, sort_order)
where not exists (select 1 from public.fields);

insert into public.sections (title, subtitle, layout, sort_order)
select * from (values
  ('Design', 'Poster, feed, dan identitas visual', 'carousel', 1),
  ('UI / UX', 'Antarmuka aplikasi dan web', 'carousel', 2),
  ('Video & Thumbnail', 'Konten yang saya produksi', 'video', 3),
  ('Website', 'Proyek web yang sudah live', 'website', 4)
) v(title, subtitle, layout, sort_order)
where not exists (select 1 from public.sections);

-- ---------- KEAMANAN (RLS) ----------
alter table public.profile  enable row level security;
alter table public.fields   enable row level security;
alter table public.sections enable row level security;
alter table public.works    enable row level security;
alter table public.admin_emails enable row level security;

drop policy if exists "public read profile"  on public.profile;
drop policy if exists "admin write profile"  on public.profile;
drop policy if exists "public read fields"   on public.fields;
drop policy if exists "admin write fields"   on public.fields;
drop policy if exists "public read sections" on public.sections;
drop policy if exists "admin write sections" on public.sections;
drop policy if exists "public read works"    on public.works;
drop policy if exists "admin write works"    on public.works;

create policy "public read profile"  on public.profile  for select using (true);
create policy "admin write profile"  on public.profile  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read fields"   on public.fields   for select using (true);
create policy "admin write fields"   on public.fields   for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read sections" on public.sections for select using (true);
create policy "admin write sections" on public.sections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read works"    on public.works    for select using (true);
create policy "admin write works"    on public.works    for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- admin_emails: tidak ada policy = tidak bisa dibaca/diubah dari luar (hanya via SQL Editor)

-- ---------- STORAGE (gambar) ----------
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

drop policy if exists "admin upload portfolio" on storage.objects;
drop policy if exists "admin update portfolio" on storage.objects;
drop policy if exists "admin delete portfolio" on storage.objects;

create policy "admin upload portfolio" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());
create policy "admin update portfolio" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio' and public.is_admin());
create policy "admin delete portfolio" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());
