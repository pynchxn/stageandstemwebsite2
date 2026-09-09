/*
 * gallery.js — turns the photo grid on about.html into a click-to-enlarge
 * lightbox you can page through.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 *  - Progressive enhancement. The grid is plain markup:
 *
 *      <div class="gallery" data-lightbox>
 *        <figure class="figure">
 *          <a href="Photos/web/bar.jpg">
 *            <img src="Photos/thumb/bar.jpg" alt="The bar at Stage & Stem">
 *          </a>
 *        </figure>
 *        … one <figure> per photo …
 *      </div>
 *
 *    With no JavaScript, clicking a thumbnail just opens the full image (the
 *    <a href>). This script intercepts the click and shows the image in an
 *    overlay instead, with prev / next, a counter, and the alt text as a caption.
 *
 *  - Navigation: on-screen chevrons, ← / → keys, or a horizontal swipe. Wraps
 *    around at both ends. Esc, the × button, or a click on the backdrop closes.
 *
 *  - To add a photo: see tools/optimize-photos.sh, then add one <figure> line
 *    to the grid in about.html. Nothing here needs to change.
 */
(function () {
  'use strict';

  var SWIPE_MIN = 45; // px of horizontal travel before a swipe counts

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== '') n.textContent = text;
    return n;
  }

  var reduceMotion = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function Lightbox(links) {
    this.links = links;                       // array of <a> elements
    this.index = 0;
    this.opener = null;                       // element to restore focus to
    this.overlay = null;
    this.img = null;
    this.count = null;
    this.caption = null;
    this.touchX = null;
    this._onKey = this._onKey.bind(this);
  }

  Lightbox.prototype.build = function () {
    if (this.overlay) return;

    var overlay = el('div', 'lightbox');
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Photo gallery');

    var closeBtn = el('button', 'lightbox-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close gallery');
    closeBtn.innerHTML = '&times;';

    var prevBtn = el('button', 'lightbox-nav lightbox-prev');
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous photo');
    prevBtn.innerHTML = '&#8249;';

    var nextBtn = el('button', 'lightbox-nav lightbox-next');
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next photo');
    nextBtn.innerHTML = '&#8250;';

    var stage = el('figure', 'lightbox-stage');
    var img = el('img', 'lightbox-img');
    img.alt = '';
    var meta = el('figcaption', 'lightbox-meta');
    var count = el('span', 'lightbox-count');
    var caption = el('span', 'lightbox-cap');
    meta.appendChild(count);
    meta.appendChild(caption);
    stage.appendChild(img);
    stage.appendChild(meta);

    overlay.appendChild(closeBtn);
    overlay.appendChild(prevBtn);
    overlay.appendChild(stage);
    overlay.appendChild(nextBtn);

    var self = this;
    closeBtn.addEventListener('click', function () { self.close(); });
    prevBtn.addEventListener('click', function () { self.go(-1); });
    nextBtn.addEventListener('click', function () { self.go(1); });

    // A click on the backdrop (anywhere that isn't the image or a button) closes.
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === stage || e.target === meta) self.close();
    });

    overlay.addEventListener('touchstart', function (e) {
      self.touchX = e.changedTouches && e.changedTouches.length ? e.changedTouches[0].clientX : null;
    }, { passive: true });
    overlay.addEventListener('touchend', function (e) {
      if (self.touchX == null) return;
      var endX = e.changedTouches && e.changedTouches.length ? e.changedTouches[0].clientX : self.touchX;
      var dx = endX - self.touchX;
      self.touchX = null;
      if (Math.abs(dx) >= SWIPE_MIN) self.go(dx < 0 ? 1 : -1);
    }, { passive: true });

    this.overlay = overlay;
    this.img = img;
    this.count = count;
    this.caption = caption;
    this.closeBtn = closeBtn;
    this.focusables = [prevBtn, nextBtn, closeBtn];

    document.body.appendChild(overlay);
  };

  Lightbox.prototype.show = function (i) {
    var n = this.links.length;
    if (!n) return;
    this.index = ((i % n) + n) % n;                 // wrap both directions
    var link = this.links[this.index];
    var thumb = link.querySelector('img');
    var label = thumb ? (thumb.getAttribute('alt') || '') : '';

    this.img.src = link.getAttribute('href');
    this.img.alt = label;
    this.count.textContent = (this.index + 1) + ' / ' + n;
    this.caption.textContent = label;

    // Preload the neighbours so paging feels instant.
    [this.index - 1, this.index + 1].forEach(function (j) {
      var k = ((j % n) + n) % n;
      var pre = new Image();
      pre.src = this.links[k].getAttribute('href');
    }, this);
  };

  Lightbox.prototype.open = function (i, opener) {
    this.build();
    this.opener = opener || null;
    this.show(i || 0);
    this.overlay.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', this._onKey);
    if (!reduceMotion) {
      // force a reflow so the CSS transition runs from the hidden state
      void this.overlay.offsetWidth;
    }
    this.overlay.classList.add('is-open');
    this.closeBtn.focus();
  };

  Lightbox.prototype.close = function () {
    if (!this.overlay || this.overlay.hidden) return;
    this.overlay.classList.remove('is-open');
    this.overlay.hidden = true;
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', this._onKey);
    this.img.src = '';
    if (this.opener && typeof this.opener.focus === 'function') this.opener.focus();
    this.opener = null;
  };

  Lightbox.prototype.go = function (delta) { this.show(this.index + delta); };

  Lightbox.prototype._onKey = function (e) {
    switch (e.key) {
      case 'Escape':     this.close(); break;
      case 'ArrowLeft':  this.go(-1); break;
      case 'ArrowRight': this.go(1); break;
      case 'Tab': {
        // Keep focus inside the dialog.
        var f = this.focusables;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (f.indexOf(document.activeElement) === -1) { e.preventDefault(); first.focus(); }
        break;
      }
    }
  };

  function init() {
    var grid = document.querySelector('.gallery[data-lightbox]');
    if (!grid) return null;
    var links = Array.prototype.slice.call(grid.querySelectorAll('a[href]'));
    if (!links.length) return null;

    var box = new Lightbox(links);
    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // let "open in new tab" work
        e.preventDefault();
        box.open(i, link);
      });
    });
    return box;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Exposed for test/gallery.test.js. No effect in the browser.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Lightbox: Lightbox, init: init };
  }
})();
