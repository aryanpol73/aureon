alter table "workspaces" enable row level security;--> statement-breakpoint
alter table "workspaces" force row level security;--> statement-breakpoint
create policy "tenant_isolation" on "workspaces"
  using ("id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
alter table "projects" enable row level security;--> statement-breakpoint
alter table "projects" force row level security;--> statement-breakpoint
create policy "tenant_isolation" on "projects"
  using ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid)
  with check ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
alter table "tasks" enable row level security;--> statement-breakpoint
alter table "tasks" force row level security;--> statement-breakpoint
create policy "tenant_isolation" on "tasks"
  using ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid)
  with check ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);