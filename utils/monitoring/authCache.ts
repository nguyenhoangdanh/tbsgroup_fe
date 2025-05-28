class AuthCache {
  private static instance: AuthCache;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance() {
    if (!AuthCache.instance) {
      AuthCache.instance = new AuthCache();
    }
    return AuthCache.instance;
  }

  set(key: string, data: any, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Auto cleanup after TTL
    setTimeout(() => {
      this.delete(key);
    }, ttl);
  }

  get(key: string) {
    const item = this.cache.get(key);

    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;

    if (isExpired) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    this.cache.forEach(item => {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        active++;
      }
    });

    return { total: this.cache.size, active, expired };
  }
}

export const authCache = AuthCache.getInstance();
