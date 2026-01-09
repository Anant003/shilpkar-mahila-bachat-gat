// loanCache.js - Centralized management for loan cache
// Persists to localStorage and allows invalidation

const LOAN_CACHE_KEY = 'loanCache';

export const loanCache = {
  get() {
    try {
      const cached = localStorage.getItem(LOAN_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading loan cache:', error);
      return null;
    }
  },

  set(loans) {
    try {
      localStorage.setItem(LOAN_CACHE_KEY, JSON.stringify(loans));
      // Trigger custom event for invalidation across components
      window.dispatchEvent(new CustomEvent('loanCacheUpdated', { detail: loans }));
    } catch (error) {
      console.error('Error writing loan cache:', error);
    }
  },

  clear() {
    try {
      localStorage.removeItem(LOAN_CACHE_KEY);
      window.dispatchEvent(new CustomEvent('loanCacheCleared'));
    } catch (error) {
      console.error('Error clearing loan cache:', error);
    }
  },

  // Attach listener for cache updates
  onUpdate(callback) {
    const listener = (event) => {
      callback(event.detail);
    };
    window.addEventListener('loanCacheUpdated', listener);
    return () => window.removeEventListener('loanCacheUpdated', listener);
  },

  // Attach listener for cache clear
  onClear(callback) {
    const listener = () => callback();
    window.addEventListener('loanCacheCleared', listener);
    return () => window.removeEventListener('loanCacheCleared', listener);
  }
};
