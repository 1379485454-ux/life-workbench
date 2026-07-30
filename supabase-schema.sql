-- ============================================================
-- 个人工作台 · Supabase 同步表结构
-- 用法：Supabase 控制台 → SQL Editor → New query → 粘贴全部 → Run
-- 只需执行一次。表建好后，工作台会自动开始云端同步。
-- ============================================================

-- 核心键值表：把前端 localStorage 里的每个 wb_* 键映射成一行
create table if not exists kv_store (
  user_id    text    not null,                       -- 固定为 'edys-workbench'（单用户多端共享）
  key        text    not null,                       -- 原 localStorage 的键名，如 wb_books
  value      jsonb   not null default '{}'::jsonb,   -- 该键对应的 JSON 值
  updated_at bigint  not null default 0,             -- 最后写入时间（毫秒时间戳，用于 last-write-wins）
  primary key (user_id, key)
);

create index if not exists kv_store_user_idx on kv_store (user_id);

-- 行级安全：用 publishable(anon) key 访问必须开 RLS；
-- 个人单用户应用用一条"全放行"策略即可（URL+key 不公开即安全）。
alter table kv_store enable row level security;

drop policy if exists "anon full access" on kv_store;
create policy "anon full access"
  on kv_store
  for all
  to anon
  using (true)
  with check (true);

-- 开启 Realtime，多端变更才能实时推送
alter publication supabase_realtime add table kv_store;
