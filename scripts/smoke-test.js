/* Headless smoke test — loads the SPA scripts with a minimal DOM mock and
   verifies every page renderer executes without throwing. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const pub = 'c:\\Users\\user\\Downloads\\PD\\apps\\web\\public';

function fakeEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(), innerHTML: '', textContent: '', value: '', disabled: false,
    name: '', type: '', style: {}, dataset: {}, _class: '', id: '',
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); },
      contains(c) { return this._s.has(c); },
    },
    addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    appendChild() {}, remove() {}, setAttribute() {}, getAttribute() { return null; },
    focus() {}, closest() { return null; }, reset() {},
  };
  Object.defineProperty(el, 'className', { get() { return el._class; }, set(v) { el._class = v; } });
  return el;
}

const elements = {};
const document = {
  getElementById(id) { if (!elements[id]) elements[id] = fakeEl('div'); return elements[id]; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement(tag) { return fakeEl(tag); },
  addEventListener() {},
};
const storage = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
const window = {
  document,
  addEventListener() {},
  history: { pushState() {} },
  location: { pathname: '/', search: '' },
  localStorage: storage,
  navigator: { clipboard: { writeText() { return Promise.resolve(); } } },
  fetch: async () => { throw new Error('offline'); },
  URLSearchParams,
  setTimeout, clearTimeout, setInterval, clearInterval,
};

const ctx = { window, document, localStorage: storage, fetch: window.fetch, console, URLSearchParams, setTimeout, clearTimeout, setInterval, clearInterval };
vm.createContext(ctx);

const files = ['api.js', 'auth.js', 'utils.js', 'router.js', 'app.js', 'pages.js', 'pages-affiliate.js', 'pages-admin.js'];
let failures = 0;
for (const f of files) {
  const code = fs.readFileSync(path.join(pub, 'js', f), 'utf8');
  try { vm.runInContext(code, ctx, { filename: f }); }
  catch (e) { failures++; console.log(`LOAD FAIL ${f}: ${e.message}`); }
}

// Browsers expose properties of window as globals; mirror them into the context
Object.assign(ctx, ctx.window);

// Seed auth as logged in
window.auth.user = { id: 'u1', name: 'Test User', email: 't@t.com', role: 'owner' };
window.auth.token = 'tok';

const checks = [
  ['renderLogin', () => window.app.renderLogin()],
  ['renderRegister', () => window.app.renderRegister()],
  ['render404', () => window.app.render404()],
  ['renderAiStudioHome()', () => window.app.renderAiStudioHome(null)],
  ['renderDashboard', () => window.app.renderDashboard()],
  ['renderProducts', () => window.app.renderProducts()],
  ['renderPromotions', () => window.app.renderPromotions()],
  ['renderEarnings', () => window.app.renderEarnings()],
  ['renderSettings', () => window.app.renderSettings()],
  ['renderIntegrations', () => window.app.renderIntegrations()],
  ['renderAdmin', () => window.app.renderAdmin()],
];

(async () => {
  for (const [name, fn] of checks) {
    try { await fn(); console.log(`OK    ${name}`); }
    catch (e) { failures++; console.log(`FAIL  ${name}: ${e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e.message}`); }
  }
  console.log(failures ? `\n${failures} FAILURES` : '\nALL CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();