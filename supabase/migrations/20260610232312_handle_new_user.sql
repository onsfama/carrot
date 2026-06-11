create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- 전화번호 유저(@karrot.app) 이메일 자동 인증
  if new.email like '%@karrot.app' then
    update auth.users
    set email_confirmed_at = now()
    where id = new.id;
  end if;

  -- user_metadata에 nickname이 있으면 프로필 자동 생성
  if (new.raw_user_meta_data->>'nickname') is not null then
    insert into public.profiles (id, nickname)
    values (new.id, new.raw_user_meta_data->>'nickname')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
