/*
 * Logic tests for events.js — run with:  node --test test/
 *
 * No dependencies, no build. These verify the data pipeline (parsing, the
 * London-time cutoff, blank-cell tolerance, Status handling, category tabs)
 * against test/fixtures.json, which mirrors the Google Sheets API response.
 *
 * DOM rendering (exact markup, filter behaviour, the loading/empty/error
 * states, responsive layout) is verified separately in test/preview.html.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const E = require('../events.js');
const FIXTURE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));

// The full pipeline events.js runs after fetch: rows → objects → drop past → sort.
function pipeline(rows, now) {
  return rows
    .map(E.normaliseRow)
    .filter(Boolean)
    .filter((e) => E.isUpcoming(e, now))
    .sort(E.byDateThenName);
}

test('parseEventDate accepts the documented formats and rejects junk', () => {
  assert.equal(E.parseEventDate('2026-04-12').iso, '2026-04-12');
  assert.equal(E.parseEventDate('2026-4-2').iso, '2026-04-02');
  assert.equal(E.parseEventDate('12/04/2026').iso, '2026-04-12', 'DD/MM/YYYY is UK order');
  assert.equal(E.parseEventDate('Apr 12, 2026').iso, '2026-04-12');
  assert.equal(E.parseEventDate('not-a-date'), null);
  assert.equal(E.parseEventDate(''), null);
  assert.equal(E.parseEventDate(null), null);
  assert.equal(E.parseEventDate('2026-13-40'), null);
});

test('parseTime normalises to 24h HH:MM', () => {
  assert.equal(E.parseTime('20:00'), '20:00');
  assert.equal(E.parseTime('8:30pm'), '20:30');
  assert.equal(E.parseTime('8pm'), '20:00');
  assert.equal(E.parseTime('12am'), '00:00');
  assert.equal(E.parseTime('12pm'), '12:00');
  assert.equal(E.parseTime(''), null);
  assert.equal(E.parseTime('nonsense'), null);
});

test('formatPrice prepends £ only to a bare number', () => {
  assert.equal(E.formatPrice('45'), '£45');
  assert.equal(E.formatPrice('12.50'), '£12.50');
  assert.equal(E.formatPrice('£45'), '£45');
  assert.equal(E.formatPrice('Pay what you can'), 'Pay what you can');
  assert.equal(E.formatPrice(''), '');
});

test('normaliseRow: Date and Name are the only required cells', () => {
  assert.equal(E.normaliseRow(['2026-07-01', '', '', '', '']), null, 'no name → skip');
  assert.equal(E.normaliseRow(['', '', '', '', 'Nameless']), null, 'no date → skip');
  assert.equal(E.normaliseRow(['not-a-date', '', '', '', 'Bad Date']), null, 'unparseable date → skip');

  const row = E.normaliseRow(['2026-04-26', '', 'Theatre', '', 'One Act Festival']);
  assert.ok(row, 'date + name only → renders');
  assert.equal(row.name, 'One Act Festival');
  assert.equal(row.tag, '');
  assert.equal(row.detail, '');
  assert.equal(row.price, '');
  assert.equal(row.priceNote, '');
  assert.equal(row.ticketUrl, '');
  assert.equal(row.status, null);
  assert.equal(row.endsTime, null);
});

test('normaliseRow: short arrays (API omits trailing empty cells) do not throw', () => {
  assert.doesNotThrow(() => E.normaliseRow(['2026-04-26', '', 'Theatre', 'Theatre', 'One Act Festival']));
  assert.doesNotThrow(() => E.normaliseRow(['2026-04-26']));
  assert.doesNotThrow(() => E.normaliseRow([]));
});

test('Status column maps to the four documented states', () => {
  const mk = (s) => E.normaliseRow(['2026-05-01', '', 'Music', '', 'X', '', '', '', s, 'https://t']);
  assert.equal(mk('').status, null);
  assert.equal(mk('Sold out').status.key, 'sold-out');
  assert.equal(mk('SOLD OUT').status.key, 'sold-out', 'case-insensitive');
  assert.equal(mk('Cancelled').status.key, 'cancelled');
  assert.equal(mk('Canceled').status.key, 'cancelled', 'US spelling too');
  assert.equal(mk('Postponed').status.key, 'postponed');
  assert.equal(mk('  Postponed  ').status.key, 'postponed', 'whitespace tolerant');
  assert.equal(mk('Sold Out').status.label, 'Sold Out');
});

test('isUpcoming: keeps an event until the end of its London day', () => {
  const evt = E.normaliseRow(['2026-06-15', '', 'Music', '', 'Test']);

  assert.equal(E.isUpcoming(evt, { date: '2026-06-14', time: '23:59' }), true, 'day before');
  assert.equal(E.isUpcoming(evt, { date: '2026-06-15', time: '00:01' }), true, 'early on the day');
  assert.equal(E.isUpcoming(evt, { date: '2026-06-15', time: '23:59' }), true, 'late on the day — still listed');
  assert.equal(E.isUpcoming(evt, { date: '2026-06-16', time: '00:01' }), false, 'the next day — gone');
});

test('isUpcoming: an Ends time cuts the event off earlier on its own day', () => {
  const evt = E.normaliseRow(['2026-06-15', '23:00', 'Music', '', 'Midnight Session']);
  assert.equal(evt.endsTime, '23:00');
  assert.equal(E.isUpcoming(evt, { date: '2026-06-15', time: '22:30' }), true, 'before Ends');
  assert.equal(E.isUpcoming(evt, { date: '2026-06-15', time: '23:30' }), false, 'after Ends');
  assert.equal(E.isUpcoming(evt, { date: '2026-06-14', time: '23:30' }), true, 'day before, Ends irrelevant');
});

test('londonNow is computed in Europe/London regardless of the visitor timezone', () => {
  // A BST instant that is one calendar day later in London than in UTC.
  const instant = new Date('2026-07-15T23:30:00Z');
  const original = process.env.TZ;
  try {
    for (const tz of ['America/Los_Angeles', 'Australia/Sydney', 'Europe/Madrid', 'UTC']) {
      process.env.TZ = tz;
      const now = E.londonNow(instant);
      assert.equal(now.date, '2026-07-16', `date under TZ=${tz}`);
      assert.equal(now.time, '00:30', `time under TZ=${tz}`);
    }
    // A GMT (winter) instant.
    process.env.TZ = 'America/Los_Angeles';
    const winter = E.londonNow(new Date('2026-01-15T09:15:00Z'));
    assert.equal(winter.date, '2026-01-15');
    assert.equal(winter.time, '09:15');
  } finally {
    process.env.TZ = original;
  }
});

test('the listing is identical whichever timezone the browser is in', () => {
  const now = { date: '2026-05-05', time: '12:00' };
  const runs = ['America/Los_Angeles', 'Australia/Sydney', 'Europe/Madrid'].map((tz) => {
    const original = process.env.TZ;
    process.env.TZ = tz;
    try {
      return pipeline(FIXTURE.values, now).map((e) => e.date.iso + ' ' + e.name);
    } finally {
      process.env.TZ = original;
    }
  });
  assert.deepEqual(runs[0], runs[1]);
  assert.deepEqual(runs[1], runs[2]);
});

test('past events drop out; the boundary is "yesterday is gone, earlier today stays"', () => {
  // Pretend "now" is mid-afternoon on the day of the 2026-05-10 event.
  const now = { date: '2026-05-10', time: '15:00' };
  const names = pipeline(FIXTURE.values, now).map((e) => e.name);

  assert.ok(names.includes("Mother's Day Brunch & Show"), 'event today is still listed');
  assert.ok(!names.includes('An Evening of Jazz'), 'April event has passed');
  assert.ok(!names.includes('Comedy Night'), 'a week-ago event has passed');
  assert.ok(names.includes('Summer Cabaret'), 'August event is upcoming');
});

test('fixture pipeline: bad-date and nameless rows are silently dropped', () => {
  const now = { date: '2026-01-01', time: '00:00' };
  const names = pipeline(FIXTURE.values, now).map((e) => e.name);
  assert.ok(!names.includes('Row With A Bad Date'));
  assert.ok(!names.some((n) => n.includes('only a date')));
});

test('events come out sorted by date then name', () => {
  const now = { date: '2026-01-01', time: '00:00' };
  const isos = pipeline(FIXTURE.values, now).map((e) => e.date.iso);
  const sorted = isos.slice().sort();
  assert.deepEqual(isos, sorted);
});

test('categoriesOf: only categories actually present, first-seen order, deduped', () => {
  const now = { date: '2026-01-01', time: '00:00' };
  const events = pipeline(FIXTURE.values, now);
  const cats = E.categoriesOf(events);

  assert.deepEqual(cats, ['Music', 'Theatre', 'Comedy', 'Special', 'Cabaret']);
  assert.ok(!cats.includes('Broken'), 'the bad-date row contributes no tab');
  assert.equal(new Set(cats.map((c) => c.toLowerCase())).size, cats.length, 'no duplicates');
});

test('categoriesOf: an event with a blank Category adds no tab', () => {
  const events = [
    E.normaliseRow(['2026-09-01', '', '', '', 'Uncategorised Night']),
    E.normaliseRow(['2026-09-02', '', 'Music', '', 'Music Night'])
  ];
  assert.deepEqual(E.categoriesOf(events), ['Music']);
});

test('missing Ticket URL leaves nothing to click', () => {
  const noUrl = E.normaliseRow(['2026-05-10', '', 'Special', '', "Mother's Day", '', '£35', 'per person', '', '']);
  assert.equal(noUrl.ticketUrl, '');
  const withUrl = E.normaliseRow(['2026-04-12', '', 'Music', '', 'Jazz', '', '£45', '', '', 'https://t']);
  assert.equal(withUrl.ticketUrl, 'https://t');
});

test('zero upcoming events is a normal outcome, not an error', () => {
  const now = { date: '2030-01-01', time: '00:00' };
  assert.deepEqual(pipeline(FIXTURE.values, now), []);
});
