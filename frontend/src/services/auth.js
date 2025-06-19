import storage from './storage';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

export const authService = {
  saveAuth(token, user) {
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, user);
  },

  getToken() {
    return storage.getItem(TOKEN_KEY);
  },

  getUser() {
    return storage.getItem(USER_KEY);
  },

  clearAuth() {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};