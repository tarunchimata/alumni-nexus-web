/**
 * Health Check Hook
 * Monitors system health and provides real-time status updates
 */

import { useState, useEffect, useCallback } from 'react';
import { healthAPI, HealthStatus } from '@/services/healthAPI';

interface UseHealthCheckOptions {
  interval?: number; // Check interval in milliseconds
  autoStart?: boolean; // Auto-start health checks
  onHealthChange?: (status: HealthStatus) => void; // Callback for status changes
}

export const useHealthCheck = (options: UseHealthCheckOptions = {}) => {
  const { interval = 30000, autoStart = true, onHealthChange } = options;
  
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useHealthCheck] Performing health check...');
      const status = await healthAPI.checkHealth();
      setHealth(status);
      onHealthChange?.(status);
      
      if (status.status === 'error') {
        setError(status.message || 'System health check failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      console.error('[useHealthCheck] Health check error:', errorMessage);
      setError(errorMessage);
      setHealth({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [onHealthChange]);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    console.log('[useHealthCheck] Starting health monitoring with interval:', interval);
    setIsMonitoring(true);
    
    // Initial check
    checkHealth();
    
    // Set up interval
    const intervalId = setInterval(checkHealth, interval);
    
    return () => {
      console.log('[useHealthCheck] Stopping health monitoring');
      clearInterval(intervalId);
      setIsMonitoring(false);
    };
  }, [checkHealth, interval, isMonitoring]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [autoStart, startMonitoring]);

  return {
    health,
    loading,
    error,
    isMonitoring,
    checkHealth,
    startMonitoring,
    stopMonitoring,
    isHealthy: health?.status === 'ok',
    lastChecked: health?.timestamp
  };
};