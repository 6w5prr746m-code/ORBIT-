-- Lets a signed-in user link their auth account to a specific `people` row
-- ("claim your profile"), so ORBIT knows which person in the org is them and
-- can offer self-service editing of their own bio, photo and skills.
--
-- No new RLS policies are needed: `people_write` and `person_skills_write`
-- (0002_rls.sql) already let any org member write any row in their own
-- organization — this column just records the link for the UI to key off,
-- and the partial unique index below stops one auth user from claiming more
-- than one person row (claiming an already-claimed row is prevented at the
-- application layer via a conditional update, not RLS, consistent with the
-- existing trust model of "any member can edit the org's data").

alter table people add column claimed_by_user_id uuid references auth.users (id) on delete set null;

create unique index people_claimed_by_user_id_key on people (claimed_by_user_id) where claimed_by_user_id is not null;
