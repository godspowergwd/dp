/**
 * Authentication State Management
 */

class Auth {
  constructor() {
    this.user = JSON.parse(localStorage.getItem('auth_user') || 'null');
    this.token = localStorage.getItem('auth_token');
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  setUser(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
    if (window.api) window.api.setToken(token);
  }

  clear() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    if (window.api) window.api.setToken(null);
  }

  async login(email, password) {
    const res = await window.api.login(email, password);
    this.setUser(res.user, res.token);
    return res;
  }

  async register(data) {
    const res = await window.api.register(data);
    this.setUser(res.user, res.token);
    return res;
  }

  async logout() {
    this.clear();
    window.app.router.navigate('/login');
  }

  async checkAuth() {
    if (!this.isAuthenticated()) return false;
    try {
      const user = await window.api.getMe();
      this.user = user;
      localStorage.setItem('auth_user', JSON.stringify(user));
      return true;
    } catch {
      this.clear();
      return false;
    }
  }
}

window.auth = new Auth();
