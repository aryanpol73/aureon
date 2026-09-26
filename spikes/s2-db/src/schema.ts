// spikes/s2-db/src/schema.ts
import { foreignKey, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
}, (t) => [unique('projects_workspace_id_id_uq').on(t.workspaceId, t.id)]); // composite FK target

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  projectId: uuid('project_id'), // nullable: MATCH SIMPLE skips the FK check when null
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: 'tasks_project_same_workspace_fk', columns: [t.workspaceId, t.projectId], foreignColumns: [projects.workspaceId, projects.id] }),
  index('tasks_workspace_created_idx').on(t.workspaceId, t.createdAt.desc()),
]);
