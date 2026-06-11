export const ENTRY_DEADLINE_ISO = "2026-06-11T19:00:00.000Z";

export const ENTRY_CLOSED_MESSAGE =
  "The World Cup has begun. Sweepstakes entries are closed.";

export function getEntryDeadlineDate() {
  return new Date(ENTRY_DEADLINE_ISO);
}

export function areSweepstakesEntriesClosed(now = new Date()) {
  return now.getTime() >= getEntryDeadlineDate().getTime();
}