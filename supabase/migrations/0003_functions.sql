-- create_organization: the only way to create an organization. Runs as the
-- table owner (security definer) so it can insert into organizations AND
-- memberships atomically, without needing a client-side insert policy on
-- either table that a malicious user could otherwise exploit.
create or replace function create_organization(org_name text, org_industry text, org_size integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into organizations (name, industry, size, is_demo)
  values (org_name, org_industry, org_size, false)
  returning id into new_org_id;

  insert into memberships (user_id, organization_id, role)
  values (auth.uid(), new_org_id, 'owner');

  insert into sources (organization_id, type, name, status) values
    (new_org_id, 'core-hr', 'Core HR', 'coming-soon'),
    (new_org_id, 'microsoft-365', 'Microsoft 365', 'coming-soon'),
    (new_org_id, 'google-workspace', 'Google Workspace', 'coming-soon'),
    (new_org_id, 'slack', 'Slack', 'coming-soon'),
    (new_org_id, 'teams', 'Microsoft Teams', 'coming-soon'),
    (new_org_id, 'notion', 'Notion', 'coming-soon'),
    (new_org_id, 'jira', 'Jira', 'coming-soon');

  return new_org_id;
end;
$$;

grant execute on function create_organization(text, text, integer) to authenticated;
