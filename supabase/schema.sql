-- ==============================================================================
-- Sunlit Pages — Complete Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================

-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Books Table
-- ------------------------------------------------------------------------------
create table if not exists public.books (
  id text primary key,
  slug text unique not null,
  title text not null,
  author text not null,
  description text not null,
  language text not null default 'en',
  cover_url text,
  genres text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for slug search and filtering
create index if not exists idx_books_slug on public.books(slug);
create index if not exists idx_books_genres on public.books using gin(genres);

-- ------------------------------------------------------------------------------
-- 2. Chapters Table
-- ------------------------------------------------------------------------------
create table if not exists public.chapters (
  id text primary key,
  book_id text not null references public.books(id) on delete cascade,
  number int not null,
  title text not null,
  content text not null,
  word_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, number)
);

create index if not exists idx_chapters_book_number on public.chapters(book_id, number);

-- ------------------------------------------------------------------------------
-- 3. Book Requests Table
-- ------------------------------------------------------------------------------
create table if not exists public.book_requests (
  id text primary key,
  user_id text not null,
  user_email text not null,
  user_name text not null,
  title text not null,
  author text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'seen', 'fulfilled', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_book_requests_status on public.book_requests(status);
create index if not exists idx_book_requests_email on public.book_requests(user_email);

-- ------------------------------------------------------------------------------
-- 4. OTP Tokens Table
-- ------------------------------------------------------------------------------
create table if not exists public.otp_tokens (
  id text primary key,
  email text not null,
  hash text not null,
  purpose text not null check (purpose in ('admin-reset', 'register-verify', 'book-request')),
  expires_at bigint not null,
  attempts_left int not null default 5,
  used boolean not null default false,
  created_at bigint not null
);

create index if not exists idx_otp_lookup on public.otp_tokens(email, purpose, used);

-- ------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
alter table public.books enable row level security;
alter table public.chapters enable row level security;
alter table public.book_requests enable row level security;
alter table public.otp_tokens enable row level security;

-- Books: Anyone can read; authenticated service role / admins can mutate
create policy "Books are viewable by everyone" 
  on public.books for select 
  using (true);

create policy "Service role manages books" 
  on public.books for all 
  using (auth.jwt() ->> 'role' = 'service_role' or auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- Chapters: Anyone can read; service role / admins can mutate
create policy "Chapters are viewable by everyone" 
  on public.chapters for select 
  using (true);

create policy "Service role manages chapters" 
  on public.chapters for all 
  using (auth.jwt() ->> 'role' = 'service_role' or auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- Book Requests: Anyone can submit; owners can read their own; service role / admins can manage
create policy "Anyone can insert book requests" 
  on public.book_requests for insert 
  with check (true);

create policy "Users can view their own requests" 
  on public.book_requests for select 
  using (
    auth.jwt() ->> 'email' = user_email 
    or auth.jwt() ->> 'role' = 'service_role'
  );

create policy "Admins can update requests" 
  on public.book_requests for update 
  using (auth.jwt() ->> 'role' = 'service_role');

-- OTP Tokens: Managed only by backend service role
create policy "Service role manages OTP tokens" 
  on public.otp_tokens for all 
  using (auth.jwt() ->> 'role' = 'service_role');

-- ------------------------------------------------------------------------------
-- 6. Storage Bucket for Book Covers
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

create policy "Public book cover access" 
  on storage.objects for select 
  using (bucket_id = 'book-covers');

create policy "Admin upload book covers" 
  on storage.objects for insert 
  with check (bucket_id = 'book-covers');
