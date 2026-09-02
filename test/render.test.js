/*
 * DOM-rendering tests for events.js — run with:  node --test test/render.test.js
 *
 * Uses test/dom-shim.js (a minimal DOM, no dependencies) to run events.js's
 * render() against fixture rows and assert on the markup it produces: structure
 * matching the original hand-written rows, Status handling, blank-cell tolerance,
 * dead-button avoidance, filter tabs, and the empty / error states.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeDocument } = require('./dom-shim.js');

const E = require('../events.js');

// Future-dated rows so events.js's real London-time cutoff keeps them.
function iso(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Stand up a fresh document with the two containers whats-on.html provides.
function setup(rows, { failFetch = false } = {}) {
  const document = makeDocument();
  const section = document.createElement('div');
  const tabs = document.createElement('div');
  tabs.className = 'filter-tabs';
  tabs.hidden = true;
  const list = document.createElement('div');
  list.className = 'events-list';
  section.appendChild(tabs);
  section.appendChild(list);
  document.body.appendChild(section);

  const opened = [];
  global.document = document;
  global.window = { console: { error() {} }, __EVENTS_PREVIEW_ROWS__: failFetch ? null : rows, open: (u) => opened.push(u) };
  global.location = { host: 'localhost', href: '' };
  global.fetch = failFetch
    ? () => Promise.reject(new Error('simulated failure'))
    : () => Promise.resolve({ ok: true, json: () => Promise.resolve({ values: rows }) });

  return { document, tabs, list, opened };
}

function teardown() {
  delete global.document; delete global.window; delete global.location; delete global.fetch;
}

test.afterEach(teardown);

test('a full row renders the same structure as the original hand-written markup', async () => {
  const { list } = setup([
    [iso(5), '', 'Music', 'Jazz · Live Music', 'An Evening of Jazz',
      'Live quartet performing classic and contemporary jazz · Dinner included · Doors 6:30pm · Show 8pm',
      '£45', 'per person', '', 'book_stage.html']
  ]);
  await E.render();

  const rows = list.querySelectorAll('.event-row');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].outerHTML,
    '<div class="event-row" data-category="Music">' +
      '<div class="event-row-date">' +
        '<div class="event-row-day">' + String(new Date(iso(5)).getDate()).padStart(2, '0') + '</div>' +
        '<div class="event-row-month">' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(iso(5)).getMonth()] + ' ' + new Date(iso(5)).getFullYear() + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="event-row-tag">Jazz · Live Music</div>' +
        '<div class="event-row-name">An Evening of Jazz</div>' +
        '<div class="event-row-detail">Live quartet performing classic and contemporary jazz · Dinner included · Doors 6:30pm · Show 8pm</div>' +
      '</div>' +
      '<div class="event-row-action">' +
        '<div class="event-row-price">£45 <span>per person</span></div>' +
        '<a class="btn btn--gold" href="book_stage.html">Book Now</a>' +
      '</div>' +
    '</div>');
});

test('date + name only: renders, with no empty tag / detail / price / action nodes', async () => {
  const { list } = setup([[iso(6), '', 'Theatre', '', 'One Act Festival']]);
  await E.render();

  const row = list.querySelector('.event-row');
  assert.ok(row);
  assert.equal(row.querySelectorAll('.event-row-tag').length, 0);
  assert.equal(row.querySelectorAll('.event-row-detail').length, 0);
  assert.equal(row.querySelectorAll('.event-row-price').length, 0);
  assert.equal(row.querySelectorAll('.event-row-action').length, 0, 'no empty action column');
  assert.equal(row.querySelectorAll('.btn').length, 0);
  assert.ok(row.classList.contains('event-row--static'), 'not clickable without a ticket URL');
  assert.equal(row.querySelector('.event-row-name').textContent, 'One Act Festival');
});

test('a bare number in Price gets a £; a note-less price has no trailing span', async () => {
  const { list } = setup([[iso(7), '', 'Music', '', 'Acoustic Sessions', '', '15', '', '', 'book_stage.html']]);
  await E.render();
  assert.equal(list.querySelector('.event-row-price').outerHTML, '<div class="event-row-price">£15</div>');
});

for (const [status, cls, badge] of [
  ['Sold out', 'sold-out', 'Sold Out'],
  ['Cancelled', 'cancelled', 'Cancelled'],
  ['Postponed', 'postponed', 'Postponed']
]) {
  test(`Status "${status}": adds .${cls}, shows a badge, removes the button and the click`, async () => {
    const { list, opened } = setup([
      [iso(8), '', 'Music', 'Tag', status + ' Event', 'detail', '£20', 'per person', status, 'https://tickets.example.com/x']
    ]);
    await E.render();

    const row = list.querySelector('.event-row');
    assert.ok(row.classList.contains(cls));
    assert.ok(row.classList.contains('event-row--static'));
    assert.equal(row.querySelectorAll('.btn').length, 0, 'no Book Now button');
    assert.equal(row.querySelectorAll('.event-row-price').length, 0, 'price replaced by the badge');
    const badgeEl = row.querySelector('.event-row-action').childNodes[0];
    assert.equal(badgeEl.textContent, badge);

    row.click();
    assert.deepEqual(opened, [], 'clicking a non-bookable row navigates nowhere');
  });
}

test('Status "Tickets Available Soon": greyed-out button, keeps the price, no click', async () => {
  const { list, opened } = setup([
    [iso(8), '20:00', 'Music', 'Tag', 'Big Show', 'detail', '£25', 'per person', 'Tickets Available Soon', 'https://tickets.example.com/x']
  ]);
  await E.render();

  const row = list.querySelector('.event-row');
  assert.ok(row.classList.contains('tickets-soon'));
  assert.ok(row.classList.contains('event-row--static'));

  const btn = row.querySelector('.btn');
  assert.ok(btn.classList.contains('btn--disabled'), 'greyed-out button');
  assert.equal(btn.tagName, 'SPAN', 'not a link — nothing to click through to');
  assert.equal(btn.textContent, 'Tickets Available Soon');
  assert.equal(row.querySelector('.event-row-price').textContent, '£25 per person', 'price still shown');
  assert.equal(row.querySelector('.event-row-time').textContent, '8:00pm', 'start time shown');

  row.click();
  assert.deepEqual(opened, [], 'not bookable yet — click goes nowhere');
});

test('an external Ticket URL opens in a new tab; the row click mirrors it', async () => {
  const { list, opened } = setup([
    [iso(9), '', 'Music', '', 'Late Night Jazz', '', '£12', '', '', 'https://tickets.designmynight.com/late']
  ]);
  await E.render();

  const btn = list.querySelector('.btn');
  assert.equal(btn.getAttribute('href'), 'https://tickets.designmynight.com/late');
  assert.equal(btn.getAttribute('target'), '_blank');
  assert.equal(btn.getAttribute('rel'), 'noopener');

  list.querySelector('.event-row').click();
  assert.deepEqual(opened, ['https://tickets.designmynight.com/late']);
});

test('missing Ticket URL: no button, no dead click', async () => {
  const { list, opened } = setup([
    [iso(10), '', 'Special', 'Special Event', "Mother's Day Brunch & Show", 'Doors 11am', '£35', 'per person', '', '']
  ]);
  await E.render();

  const row = list.querySelector('.event-row');
  assert.equal(row.querySelectorAll('.btn').length, 0);
  assert.equal(row.querySelector('.event-row-price').outerHTML, '<div class="event-row-price">£35 <span>per person</span></div>');
  row.click();
  assert.deepEqual(opened, []);
});

test('filter tabs are rebuilt from the categories present; absent categories get no tab; filtering works', async () => {
  const { list, tabs } = setup([
    [iso(3), '', 'Music', '', 'M1', '', '', '', '', ''],
    [iso(4), '', 'Comedy', '', 'C1', '', '', '', '', ''],
    [iso(5), '', 'Music', '', 'M2', '', '', '', '', '']
  ]);
  await E.render();

  const labels = tabs.querySelectorAll('.filter-tab').map((t) => t.textContent);
  assert.deepEqual(labels, ['All Events', 'Music', 'Comedy']);
  assert.equal(tabs.hidden, false);
  assert.ok(!labels.includes('Theatre'), 'no tab for a category with no events');

  // Click "Comedy" → only the Comedy row is visible.
  const comedyTab = tabs.querySelectorAll('.filter-tab').find((t) => t.textContent === 'Comedy');
  comedyTab.click();
  const vis = list.querySelectorAll('.event-row').map((r) => [r.querySelector('.event-row-name').textContent, r.style.display]);
  assert.deepEqual(vis, [['M1', 'none'], ['C1', ''], ['M2', 'none']]);
  assert.ok(comedyTab.classList.contains('active'));

  // Back to "All Events" → all visible.
  tabs.querySelectorAll('.filter-tab').find((t) => t.textContent === 'All Events').click();
  assert.deepEqual(list.querySelectorAll('.event-row').map((r) => r.style.display), ['', '', '']);
});

test('a multi-category event shows under each of its category filters', async () => {
  const { list, tabs } = setup([
    [iso(3), '', 'Music, Comedy', '', 'Musical Comedy', '', '', '', '', ''],
    [iso(4), '', 'Comedy', '', 'Pure Standup', '', '', '', '', ''],
    [iso(5), '', 'Music', '', 'Pure Music', '', '', '', '', '']
  ]);
  await E.render();

  assert.deepEqual(tabs.querySelectorAll('.filter-tab').map((t) => t.textContent), ['All Events', 'Music', 'Comedy']);
  assert.equal(list.querySelector('.event-row').getAttribute('data-category'), 'Music, Comedy');

  const vis = (label) => {
    tabs.querySelectorAll('.filter-tab').find((t) => t.textContent === label).click();
    return list.querySelectorAll('.event-row')
      .filter((r) => r.style.display !== 'none')
      .map((r) => r.querySelector('.event-row-name').textContent);
  };

  assert.deepEqual(vis('Music'), ['Musical Comedy', 'Pure Music']);
  assert.deepEqual(vis('Comedy'), ['Musical Comedy', 'Pure Standup']);
});

test('bad-date and nameless rows are dropped without breaking the render', async () => {
  const { list } = setup([
    ['not-a-date', '', 'Music', '', 'Bad Date'],
    [iso(30), '', 'Music', 'tag', '', 'detail but no name'],
    [iso(5), '', 'Music', '', 'Good One', '', '£10', '', '', 'book_stage.html']
  ]);
  await E.render();
  const names = list.querySelectorAll('.event-row-name').map((n) => n.textContent);
  assert.deepEqual(names, ['Good One']);
});

test('zero upcoming events: the empty message shows, tabs stay hidden, never a blank list', async () => {
  const { list, tabs } = setup([['2020-01-01', '', 'Music', '', 'Ancient History', '', '', '', '', '']]);
  await E.render();

  assert.equal(list.querySelectorAll('.event-row').length, 0);
  const msg = list.querySelector('.events-message');
  assert.ok(msg && msg.textContent === E.MSG.empty);
  assert.equal(tabs.hidden, true);
});

test('a failed fetch shows the error message and clears the tabs — never a blank page', async () => {
  const { list, tabs } = setup([], { failFetch: true });
  await E.render();

  const msg = list.querySelector('.events-message');
  assert.ok(msg && msg.textContent === E.MSG.error);
  assert.equal(list.querySelectorAll('.event-row').length, 0);
  assert.equal(tabs.hidden, true);
  assert.equal(tabs.querySelectorAll('.filter-tab').length, 0);
});
