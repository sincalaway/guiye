-- 归页 云同步表结构（在 Supabase 控制台 → SQL Editor 中执行一次即可）
-- 每个用户一行快照：整份 AppData JSON + 更新时间（毫秒）

create table if not exists public.guiye_snapshots (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  data        jsonb  not null,
  updated_at  bigint not null,
  device_id   text,
  created_at  timestamptz not null default now()
);

alter table public.guiye_snapshots enable row level security;

-- 只能读写自己的数据
drop policy if exists "own snapshot select" on public.guiye_snapshots;
drop policy if exists "own snapshot insert" on public.guiye_snapshots;
drop policy if exists "own snapshot update" on public.guiye_snapshots;
drop policy if exists "own snapshot delete" on public.guiye_snapshots;
create policy "own snapshot select" on public.guiye_snapshots for select using (auth.uid() = user_id);
create policy "own snapshot insert" on public.guiye_snapshots for insert with check (auth.uid() = user_id);
create policy "own snapshot update" on public.guiye_snapshots for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own snapshot delete" on public.guiye_snapshots for delete using (auth.uid() = user_id);

-- 可选：开启实时推送，其他设备修改后本机秒级更新
alter publication supabase_realtime add table public.guiye_snapshots;

-- 壁纸文件存储桶（本地上传的壁纸在登录后会上传到这里，以便跨设备使用）
insert into storage.buckets (id, name, public)
values ('guiye-wallpapers', 'guiye-wallpapers', true)
on conflict (id) do nothing;

drop policy if exists "guiye wallpaper upload" on storage.objects;
drop policy if exists "guiye wallpaper delete" on storage.objects;
create policy "guiye wallpaper upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'guiye-wallpapers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "guiye wallpaper delete" on storage.objects for delete to authenticated
  using (bucket_id = 'guiye-wallpapers' and (storage.foldername(name))[1] = auth.uid()::text);
