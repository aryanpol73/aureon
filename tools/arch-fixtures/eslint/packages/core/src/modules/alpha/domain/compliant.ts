// @expect-lint none
interface Clock {
  now(): Date;
}
export const isOverdue = (dueAt: Date, clock: Clock): boolean => dueAt.getTime() < clock.now().getTime();
