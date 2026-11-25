import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toHolidays, annotate, filterHolidays, groupByMonth, countTypes, holidaysToCsv } from '../public/js/features/holidays.js';

// Shaped exactly like Nager.Date API records
const RAW = [
  { date: '2026-12-25', localName: 'Christmas Day', name: 'Christmas Day', countryCode: 'GB', global: true, counties: null, types: ['Public'] },
  { date: '2026-01-01', localName: "New Year's Day", name: "New Year's Day", countryCode: 'GB', global: true, counties: null, types: ['Public', 'Bank'] },
  { date: '2026-11-30', localName: "St Andrew's Day", name: "Saint Andrew's Day", countryCode: 'GB', global: false, counties: ['GB-SCT'], types: ['Bank'] },
];
const TODAY = new Date(2026, 10, 25); // 25 November 2026

test('toHolidays sorts by date and fills in derived fields', () => {
  const holidays = toHolidays(RAW);
  assert.deepEqual(holidays.map((h) => h.isoDate), ['2026-01-01', '2026-11-30', '2026-12-25']);
  assert.equal(holidays[0].weekday, 'Thursday');
  assert.equal(holidays[1].nationwide, false);
  assert.deepEqual(holidays[1].regions, ['GB-SCT']);
});

test('toHolidays tolerates missing fields', () => {
  const [holiday] = toHolidays([{ date: '2026-05-01', countryCode: 'XX' }]);
  assert.equal(holiday.name, 'Unnamed holiday');
  assert.deepEqual(holiday.types, ['Public']);
  assert.equal(holiday.nationwide, true);
});

test('annotate marks past, next, long weekends and weekends', () => {
  const [newYear, standrew, christmas] = annotate(toHolidays(RAW), TODAY);
  assert.equal(newYear.isPast, true);
  assert.equal(standrew.isNext, true);
  assert.equal(standrew.daysAway, 5);
  assert.equal(standrew.isLongWeekend, true); // Monday
  assert.equal(christmas.isNext, false); // only one "next"
  assert.equal(christmas.isLongWeekend, true); // Friday
  assert.equal(newYear.isWeekend, false);
});

test('filterHolidays combines month and type filters', () => {
  const holidays = toHolidays(RAW);
  assert.equal(filterHolidays(holidays).length, 3);
  assert.equal(filterHolidays(holidays, { month: 11 }).length, 1);
  assert.equal(filterHolidays(holidays, { types: new Set(['Bank']) }).length, 2);
  assert.equal(filterHolidays(holidays, { month: 11, types: new Set(['Bank']) }).length, 0);
});

test('groupByMonth keeps month order', () => {
  const groups = groupByMonth(toHolidays(RAW));
  assert.deepEqual(groups.map((g) => g.month), [0, 10, 11]);
});

test('countTypes lists the most common type first', () => {
  assert.deepEqual(countTypes(toHolidays(RAW)), [['Public', 2], ['Bank', 2]]);
});

test('holidaysToCsv writes a header and quotes awkward values', () => {
  const csv = holidaysToCsv(toHolidays([{ ...RAW[0], name: 'Day, "special"' }]));
  const [header, row] = csv.split('\r\n');
  assert.equal(header, 'Date,Day of week,Holiday name,Local name,Country code,Holiday type,Scope');
  assert.ok(row.includes('"Day, ""special"""'));
});
