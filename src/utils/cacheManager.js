/**
 * Cache Manager
 * Two-tier caching system for performance optimization
 */

// Cache storage
const inMemoryCache = new Map();
const CACHE_PREFIX = 'sandhya_cache_';

/**
 * Cache configuration
 */
const DEFAULT_TTL = {
    SHORT: 5 * 60 * 1000,      // 5 minutes
    MEDIUM: 30 * 60 * 1000,     // 30 minutes
    LONG: 60 * 60 * 1000        // 1 hour
};

/**
 * Get from cache (checks in-memory first, then localStorage)
 * @param {string} key - Cache key
 * @returns {any} Cached data or null
 */
export const get = (key) => {
    // Check in-memory cache first (fastest)
    if (inMemoryCache.has(key)) {
        const item = inMemoryCache.get(key);

        // Check if expired
        if (item.expiresAt > Date.now()) {
            return item.data;
        } else {
            // Remove expired item
            inMemoryCache.delete(key);
        }
    }

    // Check localStorage (persistent)
    try {
        const stored = localStorage.getItem(CACHE_PREFIX + key);
        if (stored) {
            const item = JSON.parse(stored);

            // Check if expired
            if (item.expiresAt > Date.now()) {
                // Promote to in-memory cache
                inMemoryCache.set(key, item);
                return item.data;
            } else {
                // Remove expired item
                localStorage.removeItem(CACHE_PREFIX + key);
            }
        }
    } catch (error) {
        console.error('Cache get error:', error);
    }

    return null;
};

/**
 * Set cache (stores in both in-memory and localStorage)
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 5 min)
 */
export const set = (key, data, ttl = DEFAULT_TTL.SHORT) => {
    const expiresAt = Date.now() + ttl;
    const item = { data, expiresAt, cachedAt: Date.now() };

    // Store in in-memory cache
    inMemoryCache.set(key, item);

    // Store in localStorage
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
        console.error('Cache set error:', error);
        // If localStorage is full, clear old items
        if (error.name === 'QuotaExceededError') {
            clearOldItems();
            try {
                localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
            } catch (retryError) {
                console.error('Cache set retry error:', retryError);
            }
        }
    }
};

/**
 * Invalidate cache entry
 * @param {string} key - Cache key
 */
export const invalidate = (key) => {
    inMemoryCache.delete(key);
    try {
        localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
        console.error('Cache invalidate error:', error);
    }
};

/**
 * Invalidate all cache entries matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'metrics_')
 */
export const invalidatePattern = (pattern) => {
    // Clear in-memory cache
    for (const key of inMemoryCache.keys()) {
        if (key.startsWith(pattern)) {
            inMemoryCache.delete(key);
        }
    }

    // Clear localStorage
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX + pattern)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error('Cache invalidate pattern error:', error);
    }
};

/**
 * Clear all cache
 */
export const clear = () => {
    inMemoryCache.clear();

    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error('Cache clear error:', error);
    }
};

/**
 * Clear old/expired items from localStorage
 */
const clearOldItems = () => {
    try {
        const now = Date.now();
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item.expiresAt < now) {
                        keysToRemove.push(key);
                    }
                } catch {
                    // Invalid JSON, remove it
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error('Clear old items error:', error);
    }
};

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
export const getStats = () => {
    const inMemorySize = inMemoryCache.size;
    let localStorageSize = 0;

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                localStorageSize++;
            }
        }
    } catch (error) {
        console.error('Get stats error:', error);
    }

    return {
        inMemory: inMemorySize,
        localStorage: localStorageSize,
        total: inMemorySize + localStorageSize
    };
};

/**
 * Check if cache has a key
 * @param {string} key - Cache key
 * @returns {boolean}
 */
export const has = (key) => {
    return get(key) !== null;
};

/**
 * Get or set cache (get from cache, or set if not exists)
 * @param {string} key - Cache key
 * @param {function} fetchFn - Function to fetch data if not in cache
 * @param {number} ttl - Time to live
 * @returns {Promise<any>}
 */
export const getOrSet = async (key, fetchFn, ttl = DEFAULT_TTL.SHORT) => {
    // Try to get from cache
    const cached = get(key);
    if (cached !== null) {
        return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    set(key, data, ttl);

    return data;
};

export default {
    get,
    set,
    invalidate,
    invalidatePattern,
    clear,
    getStats,
    has,
    getOrSet,
    TTL: DEFAULT_TTL
};
