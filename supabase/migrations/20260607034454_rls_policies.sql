-- RLS 활성화
alter table profiles   enable row level security;
alter table items      enable row level security;
alter table categories enable row level security;
alter table likes      enable row level security;
alter table chat_rooms enable row level security;
alter table messages   enable row level security;

-- categories: 누구나 읽기
create policy "categories_read" on categories for select using (true);

-- profiles: 누구나 읽기 / 본인만 쓰기
create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- items: 누구나 읽기 / 로그인 사용자는 본인 게시글만 쓰기
create policy "items_read"   on items for select using (true);
create policy "items_insert" on items for insert with check (auth.uid() = seller_id);
create policy "items_update" on items for update using (auth.uid() = seller_id);
create policy "items_delete" on items for delete using (auth.uid() = seller_id);

-- likes: 로그인 사용자만
create policy "likes_read"   on likes for select using (auth.uid() = user_id);
create policy "likes_insert" on likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on likes for delete using (auth.uid() = user_id);

-- chat_rooms: 참여자만
create policy "chat_rooms_read" on chat_rooms for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "chat_rooms_insert" on chat_rooms for insert
  with check (auth.uid() = buyer_id);

-- messages: 채팅방 참여자만
create policy "messages_read" on messages for select
  using (
    exists (
      select 1 from chat_rooms
      where chat_rooms.id = messages.room_id
        and (chat_rooms.buyer_id = auth.uid() or chat_rooms.seller_id = auth.uid())
    )
  );
create policy "messages_insert" on messages for insert
  with check (auth.uid() = sender_id);
