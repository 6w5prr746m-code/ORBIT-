-- One-click activation: the vendor-notification email (notify-upgrade-
-- request) includes a link that flips organization_features on with a
-- single click, no SQL editor needed. The link's security comes entirely
-- from an unguessable token, never from a login — same trust model as
-- the invitation/accept-invite links already in this app.
--
-- The token lives in its own table, deliberately with NO RLS policies at
-- all (not even a select policy for the org's own members) — unlike
-- upgrade_requests itself. If the token were readable through the normal
-- app dataset fetch, a technically inclined client could read their own
-- token and self-activate the paid flag, defeating the whole point of
-- organization_features having no client write policy. Only the
-- approve-upgrade-request Edge Function ever reads or writes this table,
-- via the service-role key (which bypasses RLS entirely) — never via a
-- user's own JWT.

create table upgrade_request_approvals (
  upgrade_request_id uuid primary key references upgrade_requests (id) on delete cascade,
  approval_token uuid not null default gen_random_uuid()
);
create unique index upgrade_request_approvals_token_key on upgrade_request_approvals (approval_token);

alter table upgrade_request_approvals enable row level security;
-- No policies: default-deny for every role, including authenticated org
-- members. See comment above.
