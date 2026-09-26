-- spikes/bootstrap.sql: run by the platform admin (superuser), never by the app.
create role aureon_owner  login password 'owner_spike'  nosuperuser nobypassrls;  -- migrations
create role aureon_app    login password 'app_spike'    nosuperuser nobypassrls;  -- api + worker
create role aureon_system login password 'system_spike' nosuperuser bypassrls;    -- allowlisted maintenance jobs
grant connect, create on database aureon_spike to aureon_owner;
grant connect on database aureon_spike to aureon_app, aureon_system;
grant usage, create on schema public to aureon_owner;
grant usage on schema public to aureon_app, aureon_system;
-- Any table the owner creates (public, pgboss, drizzle schemas) is usable by the runtime roles.
alter default privileges for role aureon_owner grant usage on schemas to aureon_app, aureon_system;
alter default privileges for role aureon_owner grant select, insert, update, delete on tables to aureon_app, aureon_system;
alter default privileges for role aureon_owner grant usage, select on sequences to aureon_app, aureon_system;
