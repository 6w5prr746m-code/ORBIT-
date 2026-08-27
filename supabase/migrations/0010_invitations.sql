-- Bulk invitations: an org member creates one row per invited email with
-- the role/entity they'll join with. The role check constraint below only
-- allows the four new RBAC roles (0009_rbac.sql) — never 'owner' or
-- 'member' — so an invitation can never be used to hand out legacy
-- full-access membership.
--
-- Actually sending (or resending) the email happens via the
-- send-invitation-emails Edge Function, which holds the Resend API key
-- server-side — a client-side SPA can never hold that key safely. This
-- migration only creates the data model + the two security-definer
-- functions a client needs: one to preview an invitation before signing
-- up (get_invitation_preview), one to accept it (accept_invitation).

create table invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('hr_admin', 'director', 'manager', 'collaborator')),
  entity_id uuid references entities (id) on delete set null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  last_sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);
create index invitations_org_idx on invitations (organization_id);
create unique index invitations_token_key on invitations (token);

alter table invitations enable row level security;

-- Same loose "any org member" model as everywhere else (0002_rls.sql).
create policy invitations_select on invitations for select using (is_org_member(organization_id));
create policy invitations_write on invitations for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

-- Lets the accept-invite page show "you've been invited to join X as Y"
-- and prefill the signup email — before the person has an account, i.e.
-- before is_org_member(...) could ever be true for them. Deliberately
-- returns only the three fields the UI needs, not the row itself, so
-- knowing a token can't be used to enumerate anything else about the org.
create or replace function get_invitation_preview(invitation_token uuid)
returns table (email text, organization_name text, role text)
language sql
security definer
set search_path = public
stable
as $$
  select i.email, o.name, i.role
  from invitations i
  join organizations o on o.id = i.organization_id
  where i.token = invitation_token and i.status = 'pending';
$$;

grant execute on function get_invitation_preview(uuid) to anon, authenticated;

-- The only way a membership row is created for anyone other than an
-- organization's original creator (create_organization() handles that
-- case). Runs as security definer so it can insert into memberships
-- despite there being no client insert policy on that table — same
-- reasoning as create_organization().
create or replace function accept_invitation(invitation_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from invitations where token = invitation_token and status = 'pending';
  if inv.id is null then
    raise exception 'This invitation is invalid or has already been used.';
  end if;

  insert into memberships (user_id, organization_id, role, entity_id)
  values (auth.uid(), inv.organization_id, inv.role, inv.entity_id)
  on conflict (user_id, organization_id) do update set role = excluded.role, entity_id = excluded.entity_id;

  update invitations set status = 'accepted', accepted_at = now() where id = inv.id;

  return inv.organization_id;
end;
$$;

grant execute on function accept_invitation(uuid) to authenticated;
