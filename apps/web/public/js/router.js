/**
 * Simple Router for SPA
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentPage = null;
    window.addEventListener('popstate', () => this.resolve());
  }

  add(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.resolve();
  }

  async resolve() {
    const path = window.location.pathname;
    const handler = this.routes[path] || this.routes['/404'];
    if (handler) {
      this.currentPage = path;
      try {
        await handler();
      } catch (err) {
        console.error('Route error:', err);
        utils.toast('error', 'Navigation Error', err.message);
      }
    }
  }
}

window.router = new Router();
