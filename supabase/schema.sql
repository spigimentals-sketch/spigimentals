-- ============================================================================
-- SPIGIMENTALS — Supabase schema
-- Run this once in the Supabase SQL editor (Database → SQL editor → New query)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles
-- Mirrors auth.users with public-facing info. Supabase recommends a separate
-- table because auth.users is locked down and shouldn't be queried directly.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id              uuid references auth.users on delete cascade primary key,
  email           text unique not null,
  name            text,
  profile_pic     text,
  country         text,
  residence       text,
  tutor_badge     boolean default false,
  is_admin        boolean default false,
  enrolled_courses int[] default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.profiles enable row level security;

-- anyone signed in can read any profile (needed for classroom mates list)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- users can only insert their own profile (used by the signup trigger)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. classroom_posts
-- Replaces the localStorage version. Media is stored in Supabase Storage —
-- this table just holds the URL.
-- ----------------------------------------------------------------------------
create table public.classroom_posts (
  id            bigserial primary key,
  author_id     uuid references public.profiles(id) on delete cascade not null,
  text          text,
  media_url     text,
  media_type    text,
  reactions     jsonb default '{"👍": 0, "❤️": 0, "💡": 0}'::jsonb,
  shares        int default 0,
  created_at    timestamptz default now()
);

alter table public.classroom_posts enable row level security;

create policy "Posts are viewable by authenticated users"
  on public.classroom_posts for select using (auth.role() = 'authenticated');
create policy "Users can create posts"
  on public.classroom_posts for insert with check (auth.uid() = author_id);
create policy "Users can delete own posts"
  on public.classroom_posts for delete using (auth.uid() = author_id);
create policy "Users can update own posts"
  on public.classroom_posts for update using (auth.uid() = author_id);

create index classroom_posts_created_at_idx on public.classroom_posts (created_at desc);

-- comments and ratings as separate tables (cleaner than embedded JSON)
create table public.post_comments (
  id          bigserial primary key,
  post_id     bigint references public.classroom_posts(id) on delete cascade not null,
  author_id   uuid references public.profiles(id) on delete cascade not null,
  text        text not null,
  created_at  timestamptz default now()
);

alter table public.post_comments enable row level security;
create policy "Comments viewable by authenticated" on public.post_comments for select using (auth.role() = 'authenticated');
create policy "Users can comment" on public.post_comments for insert with check (auth.uid() = author_id);
create policy "Users can delete own comments" on public.post_comments for delete using (auth.uid() = author_id);

create table public.post_ratings (
  post_id     bigint references public.classroom_posts(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  score       int check (score between 1 and 5) not null,
  created_at  timestamptz default now(),
  primary key (post_id, user_id)
);

alter table public.post_ratings enable row level security;
create policy "Ratings viewable by authenticated" on public.post_ratings for select using (auth.role() = 'authenticated');
create policy "Users can rate" on public.post_ratings for insert with check (auth.uid() = user_id);
create policy "Users can update own rating" on public.post_ratings for update using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. carts
-- Persisted cart so it survives sign-in across devices.
-- Items column is JSON so we don't need a join for cart preview.
-- ----------------------------------------------------------------------------
create table public.carts (
  user_id     uuid references public.profiles(id) on delete cascade primary key,
  items       jsonb default '[]'::jsonb not null,
  updated_at  timestamptz default now()
);

alter table public.carts enable row level security;
create policy "Users can view own cart" on public.carts for select using (auth.uid() = user_id);
create policy "Users can upsert own cart" on public.carts for insert with check (auth.uid() = user_id);
create policy "Users can update own cart" on public.carts for update using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. orders + order_items
-- After checkout, a cart becomes an order.
-- ----------------------------------------------------------------------------
create table public.orders (
  id              bigserial primary key,
  user_id         uuid references public.profiles(id) on delete set null,
  email           text not null,
  total_usd       numeric(10, 2) not null,
  payment_method  text,                       -- 'stripe', 'flutterwave', 'momo', etc.
  payment_ref     text,                       -- gateway reference / transaction id
  status          text default 'pending',     -- pending | paid | failed | refunded
  created_at      timestamptz default now()
);

alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can create own orders" on public.orders for insert with check (auth.uid() = user_id);

create table public.order_items (
  id          bigserial primary key,
  order_id    bigint references public.orders(id) on delete cascade not null,
  item_type   text not null,                  -- 'beat' | 'pack' | 'course' | 'booking'
  item_id     int  not null,
  title       text not null,
  license     text,                           -- 'basic' | 'premium' | 'exclusive' for beats
  price_usd   numeric(10, 2) not null,
  download_url text
);

alter table public.order_items enable row level security;
create policy "Users can view items from own orders" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. bookings  (NEW — studio session booking)
-- ----------------------------------------------------------------------------
create table public.bookings (
  id              bigserial primary key,
  user_id         uuid references public.profiles(id) on delete set null,
  name            text not null,
  email           text not null,
  phone           text,
  session_type    text not null,              -- 'recording' | 'mixing' | 'mastering' | 'production'
  starts_at       timestamptz not null,
  duration_hours  int not null default 2,
  notes           text,
  status          text default 'pending',     -- pending | confirmed | cancelled | completed
  total_xaf       numeric(10, 0),             -- pricing in FCFA (local currency)
  total_usd       numeric(10, 2),
  created_at      timestamptz default now()
);

alter table public.bookings enable row level security;

-- Users can view their own bookings
create policy "Users can view own bookings" on public.bookings for select
  using (auth.uid() = user_id);

-- Anyone (including guests) can create a booking — required for guest checkout
create policy "Anyone can create a booking" on public.bookings for insert
  with check (true);

-- Only admins can update/delete bookings (you'll handle confirmations in the studio dashboard)
create policy "Admins can update bookings" on public.bookings for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Public read of *just the time slot* is needed so the booking page can show what's taken
-- without exposing customer details. We do this via a view:
create or replace view public.booked_slots as
  select id, starts_at, duration_hours, status
  from public.bookings
  where status in ('pending', 'confirmed')
    and starts_at >= now() - interval '1 day';

grant select on public.booked_slots to anon, authenticated;

create index bookings_starts_at_idx on public.bookings (starts_at);

-- ----------------------------------------------------------------------------
-- 6. Storage buckets (run these as separate statements OR create via dashboard)
-- ----------------------------------------------------------------------------
-- Storage → Create bucket → name: 'classroom-media', public: true
-- Storage → Create bucket → name: 'profile-pics',   public: true
-- Storage → Create bucket → name: 'beat-previews',  public: true
-- Storage → Create bucket → name: 'beat-downloads', public: false
--
-- Then add storage policies. Example for classroom-media (paste in SQL editor):
--
-- create policy "Authenticated can upload classroom media"
--   on storage.objects for insert
--   with check (bucket_id = 'classroom-media' and auth.role() = 'authenticated');
--
-- create policy "Public can read classroom media"
--   on storage.objects for select
--   using (bucket_id = 'classroom-media');
