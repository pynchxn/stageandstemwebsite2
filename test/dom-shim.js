/*
 * Minimal DOM shim — just enough of the browser API for events.js to run under
 * `node --test`, so the generated markup can be asserted without a real browser
 * or a heavyweight dependency. Not a general-purpose DOM.
 */
'use strict';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

class ClassList {
  constructor(el) { this.el = el; }
  _set() { return new Set((this.el._className || '').split(/\s+/).filter(Boolean)); }
  _write(set) { this.el._className = [...set].join(' '); }
  add(...cls) { const s = this._set(); cls.forEach((c) => s.add(c)); this._write(s); }
  remove(...cls) { const s = this._set(); cls.forEach((c) => s.delete(c)); this._write(s); }
  contains(c) { return this._set().has(c); }
}

class TextNode {
  constructor(text) { this.nodeType = 3; this.textContent = String(text); this.parentNode = null; }
  get outerHTML() { return esc(this.textContent); }
}

class Element {
  constructor(tag) {
    this.nodeType = 1;
    this.tagName = tag.toUpperCase();
    this.childNodes = [];
    this.attributes = new Map();
    this.parentNode = null;
    this._className = '';
    this._listeners = {};
    this.style = {};
    this.classList = new ClassList(this);
  }
  get tag() { return this.tagName.toLowerCase(); }

  set className(v) { this._className = v || ''; }
  get className() { return this._className; }

  set hidden(v) { if (v) this.attributes.set('hidden', ''); else this.attributes.delete('hidden'); }
  get hidden() { return this.attributes.has('hidden'); }

  setAttribute(k, v) {
    if (k === 'class') { this._className = String(v); return; }
    this.attributes.set(k, String(v));
  }
  getAttribute(k) {
    if (k === 'class') return this._className || null;
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }

  appendChild(node) {
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  set innerHTML(v) {
    if (v !== '') throw new Error('dom-shim: innerHTML only supports being cleared with ""');
    this.childNodes = [];
  }

  set textContent(v) {
    this.childNodes = [];
    if (v !== '' && v != null) this.appendChild(new TextNode(v));
  }
  get textContent() {
    return this.childNodes.map((n) => (n.nodeType === 3 ? n.textContent : n.textContent)).join('');
  }

  // href / target / rel behave as both properties and attributes (enough for <a>).
  set href(v) { this.attributes.set('href', String(v)); }
  get href() { return this.attributes.get('href') || ''; }
  set target(v) { this.attributes.set('target', String(v)); }
  get target() { return this.attributes.get('target') || ''; }
  set rel(v) { this.attributes.set('rel', String(v)); }
  get rel() { return this.attributes.get('rel') || ''; }

  addEventListener(type, fn) { (this._listeners[type] || (this._listeners[type] = [])).push(fn); }
  dispatch(type, event) { (this._listeners[type] || []).forEach((fn) => fn.call(this, event || {})); }
  click() { this.dispatch('click', { target: this, preventDefault() {} }); }

  closest(selector) {
    let el = this;
    while (el && el.nodeType === 1) {
      if (matchesSimple(el, selector)) return el;
      el = el.parentNode;
    }
    return null;
  }

  querySelectorAll(selector) {
    const out = [];
    walk(this, (el) => { if (el !== this && matchesCompound(el, selector)) out.push(el); });
    return out;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }

  get outerHTML() {
    const tag = this.tag;
    const attrs = [];
    if (this._className) attrs.push(`class="${escAttr(this._className)}"`);
    for (const [k, v] of this.attributes) attrs.push(v === '' ? k : `${k}="${escAttr(v)}"`);
    const open = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
    if (VOID.has(tag)) return open;
    return `${open}${this.childNodes.map((n) => n.outerHTML).join('')}</${tag}>`;
  }
  get innerHTML() { return this.childNodes.map((n) => n.outerHTML).join(''); }
}

function walk(root, fn) {
  root.childNodes.forEach((n) => {
    if (n.nodeType === 1) { fn(n); walk(n, fn); }
  });
}

// ".cls" or "tag" or "tag.cls"
function matchesSimple(el, sel) {
  if (el.nodeType !== 1) return false;
  const parts = sel.match(/[.#]?[\w-]+/g) || [];
  return parts.every((p) => {
    if (p[0] === '.') return el.classList.contains(p.slice(1));
    return el.tag === p.toLowerCase();
  });
}

// Supports a single descendant combinator: ".a .b"
function matchesCompound(el, selector) {
  const chain = selector.trim().split(/\s+/);
  const last = chain[chain.length - 1];
  if (!matchesSimple(el, last)) return false;
  let need = chain.slice(0, -1);
  let anc = el.parentNode;
  for (let i = need.length - 1; i >= 0; i--) {
    let found = false;
    while (anc && anc.nodeType === 1) {
      if (matchesSimple(anc, need[i])) { found = true; anc = anc.parentNode; break; }
      anc = anc.parentNode;
    }
    if (!found) return false;
  }
  return true;
}

class Document {
  constructor() {
    this.readyState = 'complete';
    this.documentElement = new Element('html');
    this.body = new Element('body');
    this.documentElement.appendChild(this.body);
    this._listeners = {};
  }
  createElement(tag) { return new Element(tag); }
  createTextNode(t) { return new TextNode(t); }
  addEventListener(type, fn) { (this._listeners[type] || (this._listeners[type] = [])).push(fn); }
  querySelector(sel) { return this.body.querySelector(sel); }
  querySelectorAll(sel) { return this.body.querySelectorAll(sel); }
}

function makeDocument() { return new Document(); }

module.exports = { makeDocument, Element, TextNode };
