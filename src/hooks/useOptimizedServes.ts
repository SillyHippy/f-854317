
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
              setServes(normalizeServeDataArray(cachedData.serves.slice(0, limit)));
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

      // Update optimized cache
      localStorage.setItem("serve-tracker-serves-optimized", JSON.stringify({
        serves: normalizedServes,
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error("Error loading optimized serves:", err);
      setError(err instanceof Error ? err.message : "Failed to load serves");
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
