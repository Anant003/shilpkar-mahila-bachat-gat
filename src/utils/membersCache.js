// membersCache.js - Centralized localStorage management for members data
// Prevents direct localStorage calls and enables cache invalidation

const MEMBERS_KEY = 'members';

export const membersCache = {
  get() {
    try {
      const cached = localStorage.getItem(MEMBERS_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading members cache:', error);
      return null;
    }
  },

  set(members) {
    try {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
      // Trigger custom event for invalidation across components
      window.dispatchEvent(new CustomEvent('membersUpdated', { detail: members }));
    } catch (error) {
      console.error('Error writing members cache:', error);
    }
  },

  clear() {
    try {
      localStorage.removeItem(MEMBERS_KEY);
      window.dispatchEvent(new CustomEvent('membersCleared'));
    } catch (error) {
      console.error('Error clearing members cache:', error);
    }
  },

  // Attach listener for cache updates
  onUpdate(callback) {
    const listener = (event) => {
      callback(event.detail);
    };
    window.addEventListener('membersUpdated', listener);
    return () => window.removeEventListener('membersUpdated', listener);
  },

  // Attach listener for cache clear
  onClear(callback) {
    const listener = () => callback();
    window.addEventListener('membersCleared', listener);
    return () => window.removeEventListener('membersCleared', listener);
  }
};
