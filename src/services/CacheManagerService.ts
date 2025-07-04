// CacheManagerService.ts - Cache management and temporary calculations
// Based on the CacheManager VBA script described in the PDF

interface CacheItem {
  key: string;
  value: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  averageAccessTime: number;
  oldestItem: string;
  newestItem: string;
}

export class CacheManagerService {
  private static instance: CacheManagerService;
  private cache: Map<string, CacheItem> = new Map();
  private maxCacheSize: number = 50 * 1024 * 1024; // 50MB default
  private defaultTTL: number = 30 * 60 * 1000; // 30 minutes default
  private hitCount: number = 0;
  private missCount: number = 0;
  private accessTimes: number[] = [];

  // Cache TTL configurations for different object types
  private ttlConfig = {
    market_data: 15 * 60 * 1000, // 15 minutes
    discount_factors: 60 * 60 * 1000, // 1 hour
    correlation_matrices: 2 * 60 * 60 * 1000, // 2 hours
    monte_carlo_results: 24 * 60 * 60 * 1000, // 24 hours
    portfolio_calculations: 10 * 60 * 1000, // 10 minutes
    loan_metrics: 5 * 60 * 1000, // 5 minutes
    stress_test_results: 60 * 60 * 1000, // 1 hour
    default: this.defaultTTL
  };

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): CacheManagerService {
    if (!CacheManagerService.instance) {
      CacheManagerService.instance = new CacheManagerService();
    }
    return CacheManagerService.instance;
  }

  // Set cache item with automatic TTL based on type
  set(key: string, value: any, type: string = 'default'): void {
    const startTime = performance.now();
    
    try {
      const ttl = this.ttlConfig[type as keyof typeof this.ttlConfig] || this.defaultTTL;
      const serializedValue = JSON.stringify(value);
      const size = new Blob([serializedValue]).size;
      
      // Check if cache would exceed maximum size
      if (this.getCurrentCacheSize() + size > this.maxCacheSize) {
        this.evictLeastRecentlyUsed();
      }
      
      const cacheItem: CacheItem = {
        key,
        value: serializedValue,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size
      };
      
      this.cache.set(key, cacheItem);
      
      console.log(`🗄️ Cache SET: ${key} (${type}) - Size: ${size} bytes, TTL: ${ttl}ms`);
      
    } catch (error) {
      console.error(`❌ Cache SET failed for key ${key}:`, error);
    } finally {
      const endTime = performance.now();
      this.recordAccessTime(endTime - startTime);
    }
  }

  // Get cache item
  get(key: string): any {
    const startTime = performance.now();
    
    try {
      const cacheItem = this.cache.get(key);
      
      if (!cacheItem) {
        this.missCount++;
        console.log(`🔍 Cache MISS: ${key}`);
        return null;
      }
      
      // Check if item has expired
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        this.cache.delete(key);
        this.missCount++;
        console.log(`⏰ Cache EXPIRED: ${key}`);
        return null;
      }
      
      // Update access statistics
      cacheItem.accessCount++;
      cacheItem.lastAccessed = Date.now();
      
      this.hitCount++;
      console.log(`✅ Cache HIT: ${key} (accessed ${cacheItem.accessCount} times)`);
      
      // Parse and return the value
      return JSON.parse(cacheItem.value);
      
    } catch (error) {
      console.error(`❌ Cache GET failed for key ${key}:`, error);
      this.missCount++;
      return null;
    } finally {
      const endTime = performance.now();
      this.recordAccessTime(endTime - startTime);
    }
  }

  // Check if key exists in cache
  has(key: string): boolean {
    const cacheItem = this.cache.get(key);
    if (!cacheItem) return false;
    
    // Check if expired
    if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete cache item
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      console.log(`🗑️ Cache DELETE: ${key}`);
    }
    return existed;
  }

  // Clear all cache items
  clear(): void {
    const itemCount = this.cache.size;
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.accessTimes = [];
    console.log(`🧹 Cache CLEARED: ${itemCount} items removed`);
  }

  // Clear cache by type pattern
  clearCache(type: string): void {
    const keysToDelete: string[] = [];
    
    // Find keys that match the type pattern
    for (const key of this.cache.keys()) {
      if (key.startsWith(type) || key.includes(type)) {
        keysToDelete.push(key);
      }
    }
    
    // Delete matching keys
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`🧹 Cache CLEARED by type "${type}": ${keysToDelete.length} items removed`);
  }

  // Get current cache size in bytes
  private getCurrentCacheSize(): number {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  // Evict least recently used items
  private evictLeastRecentlyUsed(): void {
    const sortedItems = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest 25% of items
    const itemsToRemove = Math.ceil(sortedItems.length * 0.25);
    
    for (let i = 0; i < itemsToRemove; i++) {
      const [key] = sortedItems[i];
      this.cache.delete(key);
      console.log(`🗑️ Cache EVICTED (LRU): ${key}`);
    }
  }

  // Record access time for performance monitoring
  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    
    // Keep only last 1000 access times
    if (this.accessTimes.length > 1000) {
      this.accessTimes.shift();
    }
  }

  // Start automatic cleanup timer
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  // Clean up expired items
  private cleanupExpiredItems(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache CLEANUP: ${keysToDelete.length} expired items removed`);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    const items = Array.from(this.cache.values());
    const totalAccesses = this.hitCount + this.missCount;
    
    return {
      totalItems: this.cache.size,
      totalSize: this.getCurrentCacheSize(),
      hitRate: totalAccesses > 0 ? (this.hitCount / totalAccesses) * 100 : 0,
      missRate: totalAccesses > 0 ? (this.missCount / totalAccesses) * 100 : 0,
      averageAccessTime: this.accessTimes.length > 0 
        ? this.accessTimes.reduce((sum, time) => sum + time, 0) / this.accessTimes.length 
        : 0,
      oldestItem: items.length > 0 
        ? items.reduce((oldest, item) => item.timestamp < oldest.timestamp ? item : oldest).key 
        : 'None',
      newestItem: items.length > 0 
        ? items.reduce((newest, item) => item.timestamp > newest.timestamp ? item : newest).key 
        : 'None'
    };
  }

  // Get cache item details
  getItemDetails(key: string): CacheItem | null {
    const item = this.cache.get(key);
    return item ? { ...item } : null;
  }

  // Get all cache keys
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache keys by type
  getKeysByType(type: string): string[] {
    return Array.from(this.cache.keys()).filter(key => 
      key.startsWith(type) || key.includes(type)
    );
  }

  // Update cache configuration
  updateTTLConfig(type: string, ttl: number): void {
    (this.ttlConfig as any)[type] = ttl;
    console.log(`🔧 Cache TTL updated for ${type}: ${ttl}ms`);
  }

  // Set maximum cache size
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    console.log(`🔧 Cache max size set to: ${size} bytes`);
    
    // Evict items if current size exceeds new limit
    if (this.getCurrentCacheSize() > this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }
  }

  // Generate cache performance report
  generateReport(): string {
    const stats = this.getStats();
    const report = `
Cache Performance Report
========================
Total Items: ${stats.totalItems}
Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB
Hit Rate: ${stats.hitRate.toFixed(2)}%
Miss Rate: ${stats.missRate.toFixed(2)}%
Average Access Time: ${stats.averageAccessTime.toFixed(2)}ms
Oldest Item: ${stats.oldestItem}
Newest Item: ${stats.newestItem}

Memory Usage: ${((stats.totalSize / this.maxCacheSize) * 100).toFixed(2)}% of maximum

Cache Items by Type:
${Object.keys(this.ttlConfig).map(type => 
  `${type}: ${this.getKeysByType(type).length} items`
).join('\n')}
    `;
    
    return report.trim();
  }

  // Export cache data for debugging
  exportCacheData(): any {
    const data: any = {};
    
    for (const [key, item] of this.cache.entries()) {
      data[key] = {
        timestamp: new Date(item.timestamp).toISOString(),
        ttl: item.ttl,
        accessCount: item.accessCount,
        lastAccessed: new Date(item.lastAccessed).toISOString(),
        size: item.size,
        expired: Date.now() - item.timestamp > item.ttl
      };
    }
    
    return {
      cacheItems: data,
      stats: this.getStats(),
      config: this.ttlConfig
    };
  }
}

export default CacheManagerService; 