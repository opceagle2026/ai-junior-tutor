-- sources 資料表
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  grade text not null,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  status text not null default 'uploaded',
  subject text not null default 'AI 尚未分析',
  unit text not null default 'AI 尚未分析',
  knowledge_points text[] not null default '{}',
  created_at timestamp with time zone not null default now()
);

-- 開發階段：允許匿名讀寫（上線前請改為登入使用者權限）
alter table public.sources enable row level security;

create policy "Allow public read access on sources"
  on public.sources
  for select
  using (true);

create policy "Allow public insert on sources"
  on public.sources
  for insert
  with check (true);

create policy "Allow public update on sources"
  on public.sources
  for update
  using (true);

-- Storage bucket：source-files
insert into storage.buckets (id, name, public)
values ('source-files', 'source-files', false)
on conflict (id) do nothing;

create policy "Allow public upload to source-files"
  on storage.objects
  for insert
  with check (bucket_id = 'source-files');

create policy "Allow public read from source-files"
  on storage.objects
  for select
  using (bucket_id = 'source-files');
