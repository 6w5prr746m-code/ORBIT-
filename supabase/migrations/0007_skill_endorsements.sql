-- Peer endorsements: lets a person with a claimed profile vouch for a
-- colleague's skill, giving self-reported skills social proof without
-- overwriting the underlying person_skills.source (which stays whatever it
-- was — self-reported, inferred, or verified via CSV import).
--
-- Unlike the loose "any org member can write anything" model used
-- elsewhere (0002_rls.sql), an endorsement asserts something about a
-- *specific person's identity* ("I, so-and-so, vouch for this"), so it
-- needs its own tighter policies: you may only write an endorsement as
-- yourself (the people row you've claimed), and you may not endorse
-- yourself.

create table skill_endorsements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  endorsed_by_person_id uuid not null references people (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (person_id, skill_id, endorsed_by_person_id),
  check (endorsed_by_person_id != person_id)
);
create index skill_endorsements_org_idx on skill_endorsements (organization_id);
create index skill_endorsements_person_skill_idx on skill_endorsements (person_id, skill_id);

alter table skill_endorsements enable row level security;

create policy skill_endorsements_select on skill_endorsements for select
  using (is_org_readable(organization_id));

create policy skill_endorsements_insert on skill_endorsements for insert
  with check (
    is_org_member(organization_id)
    and exists (
      select 1 from people p
      where p.id = endorsed_by_person_id and p.claimed_by_user_id = auth.uid()
    )
  );

create policy skill_endorsements_delete on skill_endorsements for delete
  using (
    is_org_member(organization_id)
    and exists (
      select 1 from people p
      where p.id = endorsed_by_person_id and p.claimed_by_user_id = auth.uid()
    )
  );
