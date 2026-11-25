import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseISODate, daysBetween, describeDistance, monthGrid } from '../public/js/utils/dates.js';

test('parseISODate keeps the calendar date (no time-zone shift)', () => {
  const date = parseISODate('2026-01-01');
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 0);
  assert.equal(date.getDate(), 1);
});

test('daysBetween counts whole days in both directions', () => {
  assert.equal(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 11)), 10);
  assert.equal(daysBetween(new Date(2026, 0, 11), new Date(2026, 0, 1)), -10);
  assert.equal(daysBetween(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 1, 0, 1)), 0);
});

test('describeDistance reads naturally', () => {
  assert.equal(describeDistance(0), 'today');
  assert.equal(describeDistance(1), 'tomorrow');
  assert.equal(describeDistance(5), 'in 5 days');
  assert.equal(describeDistance(-1), 'yesterday');
  assert.equal(describeDistance(-3), '3 days ago');
});

test('monthGrid lays out Monday-first weeks of 7 cells', () => {
  const weeks = monthGrid(2026, 1); // February 2026 starts on a Sunday
  assert.ok(weeks.every((week) => week.length === 7));
  assert.deepEqual(weeks[0], [null, null, null, null, null, null, 1]);
  assert.equal(weeks.flat().filter(Boolean).length, 28);
});
