import { useState, useEffect, useMemo } from 'react';
import { ServeAttemptData } from '@/components/ServeAttempt';
import { appwrite } from '@/lib/appwrite';
import { normalizeServeDataArray } from '@/utils/dataNormalization';

interface UseOptimizedServesOptions {
  limit?: number;
  autoSync?: boolean;
  syncInterval?: number;
}

export function useOptimizedServes(options: UseOptimizedServesOptions = {}) {
  const { limit = 50, autoSync = false, syncInterval = 30000 } = options;
  
  const [serves, setServes] = useState<ServeAttemptData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadServes = async (useCache = true) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try cache first if enabled
      if (useCache) {
        const cached = localStorage.getItem("serve-tracker-serves-optimized");
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            if (cachedData.timestamp && Date.now() - cachedData.timestamp < 60000) { // 1 minute cache
              // Data from cache is already normalized
              setServes(cachedData.serves.slice(0, limit));
              setIsLoading(false);
              return;
            }
          } catch (cacheError) {
            console.warn("Cache parse error:", cacheError);
          }
        }
      }

      // Fetch from Appwrite with limit
      console.log(`Loading optimized serves with limit: ${limit}`);
      const appwriteServes = await appwrite.getServeAttempts();
      
      // Sort by date (newest first) and limit
      const sortedServes = appwriteServes
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || 0).getTime();
          const dateB = new Date(b.timestamp || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, limit);

      const normalizedServes = normalizeServeDataArray(sortedServes);
      setServes(normalizedServes);
      setLastSync(new Date());

      // Update optimized cache with the full normalized data
      try {
        localStorage.setItem("serve-tracker-serves-optimized", JSON.stringify({
          serves: normalizedServes,
          timestamp: Date.now()
        }));
      } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
          console.warn("Could not cache serves due to storage quota. If this persists, consider clearing local data in settings.");
          // Attempt to clear old cache if it exists
          localStorage.removeItem("serve-tracker-serves-optimized");
        } else {
          console.error("Error saving to localStorage:", e);
        }
      }

    } catch (err) {
      console.error("Error loading optimized serves:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load serves";

      if (typeof errorMessage === 'string' && (errorMessage.includes('quota') || errorMessage.includes('exceeded'))) {
        setError(`Failed to save data locally due to storage limits. You can clear local data from the Settings page to resolve this.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshServes = () => loadServes(false);

  // Initial load
  useEffect(() => {
    loadServes(true);
  }, [limit]);

  // Optional auto-sync with longer interval
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(() => {
      console.log("Auto-syncing serves (optimized)...");
      loadServes(false);
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval]);

  const recentServes = useMemo(() => serves.slice(0, 10), [serves]);

  return {
    serves,
    recentServes,
    isLoading,
    error,
    lastSync,
    refreshServes,
    totalCount: serves.length
  };
}
