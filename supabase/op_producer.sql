-- MIKU — ตารางอันดับโปรดิวเซอร์ของทีม (ใช้กับ "อันดับทีม" ในเมนู ✦ > 🌐 ออนไลน์)
-- รันครั้งเดียวใน Supabase > SQL Editor · ไม่แตะตารางอื่นของระบบ
--
-- เก็บเฉพาะ: รหัสโปรดิวเซอร์ (สุ่มในเครื่อง), ชื่อที่ตั้งเอง, เลเวล, EXP, EXP/งานของวันนี้, วันทำงานติดกัน, จำนวนเหรียญตรา, จำนวนกลางคืน
-- ไม่มีข้อมูลสินค้า/ORDER ใดๆ
-- กันเขียนทับแถวของคนอื่น: แต่ละเครื่องมีรหัสลับสุ่ม (เก็บในเบราว์เซอร์) ฐานข้อมูลเก็บแค่ค่าแฮช และแก้แถวได้เฉพาะเมื่อรหัสลับตรง
-- อ่านอันดับผ่าน view op_producer_board (ไม่มีคอลัมน์รหัสลับ)

create extension if not exists pgcrypto;

create table if not exists public.op_producer (
  id           text primary key,
  secret_hash  text not null,
  name         text not null default 'โปรดิวเซอร์',
  level        int  not null default 1,
  exp          int  not null default 0,
  today_exp    int  not null default 0,
  today_tasks  int  not null default 0,
  day          date,
  streak       int  not null default 0,
  badges       int  not null default 0,
  rare         int  not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.op_producer enable row level security;
-- ไม่เปิดให้ anon อ่าน/เขียนตารางตรงๆ (มี secret_hash) — ใช้ view + ฟังก์ชันด้านล่างแทน
revoke all on public.op_producer from anon, authenticated;

create or replace view public.op_producer_board as
  select id, name, level, exp, today_exp, today_tasks, day, streak, badges, rare, updated_at
  from public.op_producer;
grant select on public.op_producer_board to anon, authenticated;

-- ส่งสถิติของตัวเอง (สร้างแถวใหม่ หรืออัปเดตเมื่อรหัสลับตรงเท่านั้น)
create or replace function public.op_producer_sync(
  p_id text, p_secret text, p_name text, p_level int, p_exp int,
  p_today_exp int, p_today_tasks int, p_day date, p_streak int, p_badges int, p_rare int
) returns boolean
language plpgsql security definer set search_path = public as $$
declare h text := encode(digest(p_secret, 'sha256'), 'hex');
begin
  if length(coalesce(p_id, '')) < 4 or length(coalesce(p_secret, '')) < 16 then return false; end if;
  insert into public.op_producer as t (id, secret_hash, name, level, exp, today_exp, today_tasks, day, streak, badges, rare, updated_at)
  values (p_id, h, left(coalesce(nullif(trim(p_name), ''), 'โปรดิวเซอร์'), 20),
          greatest(1, least(p_level, 100)), greatest(0, p_exp), greatest(0, p_today_exp), greatest(0, p_today_tasks),
          p_day, greatest(0, p_streak), greatest(0, least(p_badges, 99)), greatest(0, p_rare), now())
  on conflict (id) do update set
    name = excluded.name, level = excluded.level, exp = excluded.exp,
    today_exp = excluded.today_exp, today_tasks = excluded.today_tasks, day = excluded.day,
    streak = excluded.streak, badges = excluded.badges, rare = excluded.rare, updated_at = now()
  where t.secret_hash = h;
  return found;
end $$;
grant execute on function public.op_producer_sync(text, text, text, int, int, int, int, date, int, int, int) to anon, authenticated;

-- ลบแถวของตัวเอง (กดปิด "อันดับทีม" แล้วเลือกลบข้อมูล)
create or replace function public.op_producer_leave(p_id text, p_secret text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.op_producer where id = p_id and secret_hash = encode(digest(p_secret, 'sha256'), 'hex');
  return found;
end $$;
grant execute on function public.op_producer_leave(text, text) to anon, authenticated;
