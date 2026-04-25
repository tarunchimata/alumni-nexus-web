/**
 * Health Check API Service
 * Provides system health monitoring capabilities
 */

import { apiService } from './apiService';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  services?: {
    database?: 'ok' | 'error';
    api?: 'ok' | 'error';
    auth?: 'ok' | 'error';
  };
  message?: string;
}

class HealthAPI {
  /**
   * Check overall system health
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      console.log('[HealthAPI] Checking system health...');
      const response = await apiService.checkHealth() as any;
      console.log('[HealthAPI] Health check response:', response);
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: response?.services || {},
        message: response?.message || 'System is healthy'
      };
    } catch (error) {
      console.error('[HealthAPI] Health check failed:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  /**
   * Check if API is responsive
   */
  async ping(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      console.error('[HealthAPI] Ping failed:', error);
      return false;
    }
  }
}

export const healthAPI = new HealthAPI();
export default healthAPI;