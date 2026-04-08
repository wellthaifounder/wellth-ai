-- Create savings_goals table for the Insights > Goals tab
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null,
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  deadline date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.savings_goals enable row level security;

-- RLS policies
create policy "Users can view their own savings goals"
  on public.savings_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own savings goals"
  on public.savings_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own savings goals"
  on public.savings_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own savings goals"
  on public.savings_goals for delete
  using (auth.uid() = user_id);
