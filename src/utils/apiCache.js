/**
 * apiCache.js - Intelligent API response caching with TTL (time-to-live)
 * Reduces SheetDB API calls by caching responses and providing invalidation hooks
 */

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_KEY_PREFIX = 'api_cache_';

class ApiCache {
  constructor() {
    this.memory = {}; // In-memory cache (fast)
    this.listeners = {}; // Event listeners for cache updates
  }

  /**
   * Generate a cache key from endpoint and optional filters
   */
  getCacheKey(endpoint, filters = {}) {
    const filterStr = Object.entries(filters)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `${CACHE_KEY_PREFIX}${endpoint}${filterStr ? '_' + filterStr : ''}`;
  }

  /**
   * Fetch data with automatic caching and TTL
   */
  async fetch(endpoint, options = {}) {
    const { 
      ttl = DEFAULT_TTL, 
      forceRefresh = false, 
      filters = {}, 
      method = 'GET',
      body = null 
    } = options;

    const cacheKey = this.getCacheKey(endpoint, filters);

    // Return cached data if valid and not forced refresh
    if (!forceRefresh && this.isValidCache(cacheKey)) {
      console.log(`[Cache HIT] ${endpoint}`);
      return this.getCached(cacheKey);
    }

    console.log(`[Cache MISS] ${endpoint} - Fetching from API...`);

    try {
      const fetchOptions = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, fetchOptions);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the response with timestamp and TTL
      this.setCached(cacheKey, data, ttl);
      console.log(`[Cache SET] ${endpoint}`);

      // Notify listeners
      this.notifyListeners(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`[Cache ERROR] ${endpoint}:`, error);
      
      // Fall back to stale cache if available
      const staleData = this.memory[cacheKey];
      if (staleData) {
        console.log(`[Cache STALE] Returning stale data for ${endpoint}`);
        return staleData.data;
      }

      throw error;
    }
  }

  /**
   * Check if cache entry exists and is not expired
   */
  isValidCache(key) {
    if (!this.memory[key]) return false;
    
    const { expiresAt } = this.memory[key];
    if (expiresAt && Date.now() > expiresAt) {
      delete this.memory[key];
      return false;
    }

    return true;
  }

  /**
   * Get cached data
   */
  getCached(key) {
    if (this.memory[key]) {
      return this.memory[key].data;
    }
    return null;
  }

  /**
   * Set cache with TTL
   */
  setCached(key, data, ttl) {
    this.memory[key] = {
      data,
      expiresAt: Date.now() + ttl
    };
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(endpoint, filters = {}) {
    const cacheKey = this.getCacheKey(endpoint, filters);
    delete this.memory[cacheKey];
    console.log(`[Cache INVALIDATE] ${cacheKey}`);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern) {
    Object.keys(this.memory).forEach(key => {
      if (key.includes(pattern)) {
        delete this.memory[key];
        console.log(`[Cache INVALIDATE PATTERN] ${key}`);
      }
    });
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memory = {};
    console.log('[Cache CLEAR] All cache cleared');
  }

  /**
   * Register listener for cache updates
   */
  onUpdate(cacheKey, callback) {
    if (!this.listeners[cacheKey]) {
      this.listeners[cacheKey] = [];
    }
    this.listeners[cacheKey].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[cacheKey] = this.listeners[cacheKey].filter(
        cb => cb !== callback
      );
    };
  }

  /**
   * Notify all listeners of cache update
   */
  notifyListeners(cacheKey, data) {
    if (this.listeners[cacheKey]) {
      this.listeners[cacheKey].forEach(callback => callback(data));
    }
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    const stats = {};
    Object.entries(this.memory).forEach(([key, { expiresAt }]) => {
      const expired = expiresAt && Date.now() > expiresAt;
      stats[key] = {
        expired,
        expiresIn: expiresAt ? Math.round((expiresAt - Date.now()) / 1000) : 'never'
      };
    });
    return stats;
  }
}

// Export singleton instance
export const apiCache = new ApiCache();
