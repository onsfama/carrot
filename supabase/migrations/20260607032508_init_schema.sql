-- profiles: 사용자 프로필 (auth.users 확장)
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  nickname    text not null,
  avatar_url  text,
  location    text,
  created_at  timestamptz not null default now()
);

-- categories: 상품 카테고리
create table if not exists categories (
  id    serial primary key,
  name  text not null unique,
  icon  text not null,
  color text not null
);

insert into categories (name, icon, color) values
  ('중고거래',    'swap-horizontal', '#FF6F0F'),
  ('부동산',      'home',            '#4CAF50'),
  ('알바',        'briefcase',       '#2196F3'),
  ('중고차',      'car',             '#9C27B0'),
  ('동네맛집',    'restaurant',      '#F44336'),
  ('과외·클래스', 'school',          '#FF9800'),
  ('생활서비스',  'construct',       '#00BCD4'),
  ('농수산물',    'leaf',            '#8BC34A');

-- items: 상품 목록
create table if not exists items (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  price        integer,
  price_type   text not null default 'fixed' check (price_type in ('fixed', 'negotiable', 'free')),
  category_id  integer references categories(id),
  location     text not null,
  status       text not null default 'selling' check (status in ('selling', 'reserved', 'sold')),
  image_urls   text[] not null default '{}',
  view_count   integer not null default 0,
  like_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- likes: 좋아요
create table if not exists likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  item_id    uuid not null references items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

-- chat_rooms: 채팅방
create table if not exists chat_rooms (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references items(id) on delete cascade,
  buyer_id   uuid not null references profiles(id) on delete cascade,
  seller_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (item_id, buyer_id)
);

-- messages: 채팅 메시지
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references chat_rooms(id) on delete cascade,
  sender_id  uuid not null references profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

-- items.updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_updated_at
  before update on items
  for each row execute function update_updated_at();

-- likes 변경 시 items.like_count 동기화
create or replace function sync_like_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update items set like_count = like_count + 1 where id = new.item_id;
  elsif (tg_op = 'DELETE') then
    update items set like_count = like_count - 1 where id = old.item_id;
  end if;
  return null;
end;
$$;

create trigger likes_sync_count
  after insert or delete on likes
  for each row execute function sync_like_count();
