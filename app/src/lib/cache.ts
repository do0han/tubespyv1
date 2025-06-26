// 메모리 기반 캐시 (개발 환경용)
// 실제 운영 환경에서는 Redis나 다른 캐시 솔루션 사용 권장

interface CacheItem {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem>();
  private defaultTTL = 5 * 60 * 1000; // 5분 기본 TTL

  set(key: string, data: any, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 만료 검사
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 만료된 항목들 정리
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // 캐시 상태 확인
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 싱글톤 인스턴스
const cache = new MemoryCache();

// 정기적으로 만료된 항목 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// YouTube 검색 결과 캐시 키 생성
export function createSearchCacheKey(
  query: string, 
  searchMode: string, 
  maxResults: number, 
  pageToken?: string
): string {
  const keyParts = [
    'youtube_search',
    searchMode,
    query.toLowerCase().trim(),
    maxResults.toString(),
    pageToken || 'first'
  ];
  return keyParts.join(':');
}

// 캐시된 검색 결과 가져오기
export function getCachedSearchResults(key: string): any | null {
  return cache.get(key);
}

// 검색 결과 캐시에 저장
export function setCachedSearchResults(key: string, data: any, ttl?: number): void {
  cache.set(key, data, ttl);
}

// 특정 검색어의 모든 캐시 삭제
export function clearSearchCache(query: string): void {
  const stats = cache.getStats();
  const keysToDelete = stats.keys.filter(key => 
    key.includes(`youtube_search`) && key.includes(query.toLowerCase().trim())
  );
  
  keysToDelete.forEach(key => cache.delete(key));
}

// 전체 캐시 삭제
export function clearAllCache(): void {
  cache.clear();
}

// 캐시 상태 확인
export function getCacheStats() {
  return cache.getStats();
}

export default cache; 