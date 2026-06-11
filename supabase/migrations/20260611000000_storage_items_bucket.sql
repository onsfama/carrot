-- items 버킷 생성 (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'items', 'items', true,
  5242880,
  array['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- 누구나 읽기 가능
create policy "items_images_read" on storage.objects
  for select using (bucket_id = 'items');

-- 인증 유저는 자기 폴더에만 업로드
create policy "items_images_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'items' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 본인 파일만 삭제
create policy "items_images_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'items' AND (storage.foldername(name))[1] = auth.uid()::text);
