/*
 * events.js — builds the What's On listing on whats-on.html from a Google Sheet,
 * so staff can add and remove gigs without touching code.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 *  - Reads the published sheet through the read-only Google Sheets API (no backend).
 *  - Drops any event whose day has passed, compared in London time — so a visitor
 *    in Spain sees the same listing as a visitor in Cardiff.
 *  - Rebuilds the category filter tabs from the categories actually present.
 *  - Only the Date and Name cells are required. Every other cell may be blank and
 *    the row still renders.
 *
 *  Sheet columns, in order (row 1 is the header, data starts on row 2):
 *    A Date        2026-04-12         required — YYYY-MM-DD (also accepts DD/MM/YYYY)
 *    B Start time  20:00              optional — shown on the row; blank = no time shown
 *    C Category    Music, Comedy      optional — drives the filter tabs; comma-separated for several
 *    D Tag         Jazz · Live Music  optional — small label above the name
 *    E Name        An Evening of Jazz required
 *    F Detail      Doors 6:30pm…      optional
 *    G Price       £45                optional — a bare number gets a £ prepended
 *    H Price note  per person         optional
 *    I Status      (blank)            optional — blank | Sold out | Cancelled | Postponed | Tickets Available Soon
 *    J Ticket URL  https://…          optional — no URL means no Book Now button
 *
 *  See README.md → "Events Calendar" for the full setup (sheet, API key, columns).
 */
(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────────────────────────
   *  CONFIG — edit these, nothing else.
   * ─────────────────────────────────────────────────────────────────────────── */
  var CONFIG = {
    // The long id in the middle of the sheet URL:
    //   https://docs.google.com/spreadsheets/d/THIS_PART/edit
    sheetId: '1YVGS0mzneAam9PhVbvnrprnf-EWyZS8l1lqGP8vqpl8',

    // A Google Sheets API key that is restricted to:
    //   (a) the "Google Sheets API" only, and
    //   (b) the HTTP referrer  https://stageandstem.com/*
    // Without the referrer restriction the key can be lifted from this file and
    // spent against the quota. See README.md.
    apiKey: 'AIzaSyCQwt-MeZr_aY1iYv7fcXtsaHpqbfHVM_A',

    // Tab name + cell range. Keep the tab named "Events", or change it here.
    range: 'Events!A2:J',

    // Events appear/disappear on London time, never the visitor's clock.
    timeZone: 'Europe/London'
  };

  /* ─────────────────────────────────────────────────────────────────────────── */

  var COLUMNS = ['date', 'start', 'category', 'tag', 'name', 'detail', 'price', 'priceNote', 'status', 'ticketUrl'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Recognised Status values → CSS class + badge text + badge class.
  // `asButton: true` renders the label as a greyed-out, non-clickable button
  // instead of a small badge.
  var STATUS = {
    'sold out':  { key: 'sold-out',  label: 'Sold Out',  badge: 'sold-out-badge' },
    'cancelled': { key: 'cancelled', label: 'Cancelled', badge: 'event-status-badge' },
    'canceled':  { key: 'cancelled', label: 'Cancelled', badge: 'event-status-badge' },
    'postponed': { key: 'postponed', label: 'Postponed', badge: 'event-status-badge' },
    'tickets available soon': { key: 'tickets-soon', label: 'Tickets Available Soon', badge: 'event-status-badge', asButton: true }
  };

  var MSG = {
    loading: 'Loading upcoming events…',
    empty: 'No upcoming events are listed right now — check back soon, or follow us on social media.',
    error: 'We couldn’t load the events listing just now. Please refresh the page, or email ' +
           'info@stageandstem.com for what’s coming up.'
  };

  /* ── Parsing ────────────────────────────────────────────────────────────── */

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function ymd(y, mo, d) {
    if (!(mo >= 1 && mo <= 12) || !(d >= 1 && d <= 31)) return null;
    return { y: y, mo: mo, d: d, iso: y + '-' + pad(mo) + '-' + pad(d) };
  }

  // Accepts "YYYY-MM-DD", "DD/MM/YYYY" (UK order), or anything Date.parse understands.
  function parseEventDate(raw) {
    if (raw == null || raw === '') return null;
    var s = String(raw).trim();
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (m) return ymd(+m[1], +m[2], +m[3]);
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (m) return ymd(+m[3], +m[2], +m[1]);
    var t = Date.parse(s);
    if (!isNaN(t)) { var d = new Date(t); return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
    return null;
  }

  // "20:00", "8:00pm", "8pm" → "20:00"; junk → null.
  function parseTime(raw) {
    if (raw == null || raw === '') return null;
    var m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(String(raw).trim());
    if (!m) return null;
    var h = +m[1], min = m[2] ? +m[2] : 0;
    if (m[3]) {
      var pm = /pm/i.test(m[3]);
      if (h === 12) h = pm ? 12 : 0;
      else if (pm) h += 12;
    }
    if (h > 23 || min > 59) return null;
    return pad(h) + ':' + pad(min);
  }

  // "20:00" → "8:00pm", "19:30" → "7:30pm", "09:00" → "9:00am". Input is the
  // normalised 24h string from parseTime(); anything else → ''.
  function formatTime(t) {
    if (!t) return '';
    var m = /^(\d{2}):(\d{2})$/.exec(t);
    if (!m) return '';
    var h = +m[1], min = m[2];
    var suffix = h < 12 ? 'am' : 'pm';
    var h12 = h % 12 || 12;
    return h12 + ':' + min + suffix;
  }

  function formatPrice(p) {
    if (p == null || p === '') return '';
    var s = String(p).trim();
    return /^\d+(\.\d{1,2})?$/.test(s) ? '£' + s : s;
  }

  // "Music, Comedy" → ['Music', 'Comedy']. Comma-separated, trimmed, blanks
  // dropped, de-duped case-insensitively (first spelling wins).
  function parseCategories(raw) {
    if (raw == null || raw === '') return [];
    var seen = {}, out = [];
    String(raw).split(',').forEach(function (part) {
      var c = part.trim();
      var k = c.toLowerCase();
      if (c && !seen[k]) { seen[k] = true; out.push(c); }
    });
    return out;
  }

  // Current date + time in London, independent of the visitor's timezone.
  function londonNow(date) {
    var d = date || new Date();
    var parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: CONFIG.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
    var hour = (parts.hour === '24' ? '00' : parts.hour); // some engines emit "24" at midnight
    return { date: parts.year + '-' + parts.month + '-' + parts.day, time: hour + ':' + parts.minute };
  }

  // Keep an event listed until the end of its day in London — never based on the
  // visitor's clock. The Start time is display-only and does not hide the row.
  function isUpcoming(evt, now) {
    now = now || londonNow();
    if (!evt || !evt.date) return false;
    return now.date <= evt.date.iso;
  }

  // One raw sheet row (array of cells) → an event object, or null to skip it.
  function normaliseRow(row) {
    row = row || [];
    var get = function (i) { return row[i] == null ? '' : String(row[i]).trim(); };
    var raw = {};
    COLUMNS.forEach(function (name, i) { raw[name] = get(i); });

    if (!raw.date || !raw.name) return null;          // Date + Name are the only required cells
    var date = parseEventDate(raw.date);
    if (!date) return null;                           // unparseable date → skip, don't break the page

    return {
      date: date,
      startTime: parseTime(raw.start),
      categories: parseCategories(raw.category),
      tag: raw.tag,
      name: raw.name,
      detail: raw.detail,
      price: formatPrice(raw.price),
      priceNote: raw.priceNote,
      ticketUrl: raw.ticketUrl,
      status: STATUS[raw.status.toLowerCase().replace(/\s+/g, ' ')] || null
    };
  }

  // Every category present across all events, first-seen order, de-duped
  // case-insensitively. An event can list several (see parseCategories).
  function categoriesOf(events) {
    var seen = {}, out = [];
    events.forEach(function (e) {
      (e.categories || []).forEach(function (c) {
        var k = c.toLowerCase();
        if (!seen[k]) { seen[k] = true; out.push(c); }
      });
    });
    return out;
  }

  function byDateThenName(a, b) {
    if (a.date.iso !== b.date.iso) return a.date.iso < b.date.iso ? -1 : 1;
    return a.name.localeCompare(b.name);
  }

  /* ── DOM ────────────────────────────────────────────────────────────────── */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== '') n.textContent = text;
    return n;
  }

  function isExternal(url) {
    return /^https?:\/\//i.test(url) && url.indexOf('//' + location.host) === -1;
  }

  function buildAction(evt) {
    if (evt.status) {
      var s = el('div', 'event-row-action');
      if (evt.status.asButton) {
        if (evt.price) {
          var p = el('div', 'event-row-price');
          p.appendChild(document.createTextNode(evt.price + (evt.priceNote ? ' ' : '')));
          if (evt.priceNote) p.appendChild(el('span', null, evt.priceNote));
          s.appendChild(p);
        }
        s.appendChild(el('span', 'btn btn--gold btn--disabled', evt.status.label));
      } else {
        s.appendChild(el('div', evt.status.badge, evt.status.label));
      }
      return s;
    }
    var hasPrice = !!evt.price, hasBtn = !!evt.ticketUrl;
    if (!hasPrice && !hasBtn) return null;

    var action = el('div', 'event-row-action');
    if (hasPrice) {
      var price = el('div', 'event-row-price');
      price.appendChild(document.createTextNode(evt.price + (evt.priceNote ? ' ' : '')));
      if (evt.priceNote) price.appendChild(el('span', null, evt.priceNote));
      action.appendChild(price);
    }
    if (hasBtn) {
      var btn = el('a', 'btn btn--gold', 'Book Now');
      btn.href = evt.ticketUrl;
      if (isExternal(evt.ticketUrl)) { btn.target = '_blank'; btn.rel = 'noopener'; }
      action.appendChild(btn);
    }
    return action;
  }

  function eventRow(evt) {
    var row = el('div', 'event-row');
    if (evt.categories.length) row.setAttribute('data-category', evt.categories.join(', '));

    var clickable = !evt.status && !!evt.ticketUrl;
    if (evt.status) row.classList.add(evt.status.key);
    if (!clickable) row.classList.add('event-row--static');

    var date = el('div', 'event-row-date');
    date.appendChild(el('div', 'event-row-day', pad(evt.date.d)));
    date.appendChild(el('div', 'event-row-month', MONTHS[evt.date.mo - 1] + ' ' + evt.date.y));
    var startLabel = formatTime(evt.startTime);
    if (startLabel) date.appendChild(el('div', 'event-row-time', startLabel));
    row.appendChild(date);

    var mid = el('div');
    if (evt.tag) mid.appendChild(el('div', 'event-row-tag', evt.tag));
    mid.appendChild(el('div', 'event-row-name', evt.name));
    if (evt.detail) mid.appendChild(el('div', 'event-row-detail', evt.detail));
    row.appendChild(mid);

    var action = buildAction(evt);
    if (action) row.appendChild(action);

    if (clickable) {
      var external = isExternal(evt.ticketUrl);
      row.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;              // let the Book Now link handle itself
        if (external) window.open(evt.ticketUrl, '_blank', 'noopener');
        else window.location.href = evt.ticketUrl;
      });
    }
    return row;
  }

  function applyFilter(filter) {
    document.querySelectorAll('.events-list .event-row').forEach(function (row) {
      var cats = (row.getAttribute('data-category') || '').split(',').map(function (s) { return s.trim(); });
      var show = filter === 'All Events' || cats.indexOf(filter) !== -1;
      row.style.display = show ? '' : 'none';
    });
  }

  function renderTabs(box, categories) {
    box.innerHTML = '';
    if (!categories.length) { box.hidden = true; return; }
    box.hidden = false;
    ['All Events'].concat(categories).forEach(function (label, i) {
      var tab = el('div', 'filter-tab' + (i === 0 ? ' active' : ''), label);
      tab.setAttribute('data-filter', label);
      tab.addEventListener('click', function () {
        box.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        applyFilter(label);
      });
      box.appendChild(tab);
    });
  }

  function message(list, text) {
    list.innerHTML = '';
    list.appendChild(el('p', 'events-message', text));
  }

  function fetchRows() {
    // Test seam: test/preview.html sets this to the fixture rows so the page can
    // be checked in a browser without a live sheet. Never set in production.
    if (typeof window !== 'undefined' && window.__EVENTS_PREVIEW_ROWS__) {
      return Promise.resolve(window.__EVENTS_PREVIEW_ROWS__);
    }
    if (/REPLACE_WITH/.test(CONFIG.sheetId) || /REPLACE_WITH/.test(CONFIG.apiKey)) {
      return Promise.reject(new Error('events.js is not configured — set sheetId and apiKey'));
    }
    var url = 'https://sheets.googleapis.com/v4/spreadsheets/' +
      encodeURIComponent(CONFIG.sheetId) + '/values/' + encodeURIComponent(CONFIG.range) +
      '?key=' + encodeURIComponent(CONFIG.apiKey) +
      '&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING';
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Sheets API HTTP ' + r.status);
      return r.json();
    }).then(function (data) { return (data && data.values) || []; });
  }

  function render() {
    var list = document.querySelector('.events-list');
    var tabsBox = document.querySelector('.filter-tabs');
    if (!list) return;

    message(list, MSG.loading);

    return fetchRows().then(function (rows) {
      var events = rows.map(normaliseRow)
        .filter(Boolean)
        .filter(function (e) { return isUpcoming(e); })
        .sort(byDateThenName);

      if (tabsBox) renderTabs(tabsBox, categoriesOf(events));

      if (!events.length) { message(list, MSG.empty); return; }

      list.innerHTML = '';
      events.forEach(function (e) { list.appendChild(eventRow(e)); });
    }).catch(function (err) {
      if (typeof console !== 'undefined' && console.error) console.error('[events]', (err && err.message) || err);
      if (tabsBox) { tabsBox.innerHTML = ''; tabsBox.hidden = true; }
      message(list, MSG.error);
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render);
    } else {
      render();
    }
  }

  // Exposed for the fixture tests (test/events.test.js). No effect in the browser.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONFIG: CONFIG, STATUS: STATUS,
      parseEventDate: parseEventDate, parseTime: parseTime, formatTime: formatTime,
      formatPrice: formatPrice, parseCategories: parseCategories,
      londonNow: londonNow, isUpcoming: isUpcoming, normaliseRow: normaliseRow,
      categoriesOf: categoriesOf, byDateThenName: byDateThenName,
      render: render, eventRow: eventRow, MSG: MSG
    };
  }
})();
