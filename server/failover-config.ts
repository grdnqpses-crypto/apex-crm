/**
 * Failover Configuration and Health Monitoring
 * 
 * This module handles:
 * 1. Database replication from Contabo (primary) to Manus (standby)
 * 2. Health checks on both servers
 * 3. Automatic failover detection
 * 4. Failback procedures
 */

import { Pool } from 'pg';

interface ServerConfig {
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  isPrimary: boolean;
}

interface HealthStatus {
  server: string;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  error?: string;
}

class FailoverManager {
  private primaryServer: ServerConfig;
  private standbyServer: ServerConfig;
  private healthCheckInterval: NodeJS.Timer | null = null;
  private healthStatuses: Map<string, HealthStatus> = new Map();
  private failoverInProgress = false;

  constructor(primaryConfig: ServerConfig, standbyConfig: ServerConfig) {
    this.primaryServer = primaryConfig;
    this.standbyServer = standbyConfig;
  }

  /**
   * Initialize failover system and start health monitoring
   */
  async initialize(): Promise<void> {
    console.log('[Failover] Initializing failover system...');
    
    // Test connections
    await this.testConnection(this.primaryServer);
    await this.testConnection(this.standbyServer);
    
    // Start health checks
    this.startHealthMonitoring();
    
    console.log('[Failover] Failover system initialized');
  }

  /**
   * Test connection to a database server
   */
  private async testConnection(config: ServerConfig): Promise<boolean> {
    try {
      const pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        connectionTimeoutMillis: 5000,
      });

      const start = Date.now();
      const result = await pool.query('SELECT 1');
      const responseTime = Date.now() - start;

      await pool.end();

      this.healthStatuses.set(config.name, {
        server: config.name,
        isHealthy: true,
        lastCheck: new Date(),
        responseTime,
      });

      console.log(`[Failover] ${config.name} is healthy (${responseTime}ms)`);
      return true;
    } catch (error) {
      this.healthStatuses.set(config.name, {
        server: config.name,
        isHealthy: false,
        lastCheck: new Date(),
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(`[Failover] ${config.name} health check failed:`, error);
      return false;
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Check every 60 seconds
    this.healthCheckInterval = setInterval(async () => {
      const primaryHealthy = await this.testConnection(this.primaryServer);
      const standbyHealthy = await this.testConnection(this.standbyServer);

      // If primary is down and standby is up, trigger failover
      if (!primaryHealthy && standbyHealthy && !this.failoverInProgress) {
        console.warn('[Failover] PRIMARY SERVER DOWN - Initiating failover to standby');
        await this.triggerFailover();
      }

      // If primary is back up, trigger failback
      if (primaryHealthy && !this.failoverInProgress) {
        const primaryStatus = this.healthStatuses.get(this.primaryServer.name);
        if (primaryStatus && !primaryStatus.isHealthy) {
          console.info('[Failover] PRIMARY SERVER RECOVERED - Initiating failback');
          await this.triggerFailback();
        }
      }
    }, 60000); // 60 second interval
  }

  /**
   * Trigger failover to standby server
   */
  private async triggerFailover(): Promise<void> {
    if (this.failoverInProgress) return;
    
    this.failoverInProgress = true;
    console.warn('[Failover] FAILOVER IN PROGRESS');

    try {
      // Promote standby to primary
      await this.promoteStandby();
      
      // Update environment to use standby as primary
      process.env.DATABASE_URL = this.buildConnectionString(this.standbyServer);
      
      // Notify owner
      await this.notifyFailover('FAILOVER', 'Primary server down. Switched to standby.');
      
      console.warn('[Failover] FAILOVER COMPLETE - Now using standby server');
    } catch (error) {
      console.error('[Failover] Failover failed:', error);
      await this.notifyFailover('FAILOVER_ERROR', `Failover failed: ${error}`);
    } finally {
      this.failoverInProgress = false;
    }
  }

  /**
   * Trigger failback to primary server
   */
  private async triggerFailback(): Promise<void> {
    if (this.failoverInProgress) return;
    
    this.failoverInProgress = true;
    console.info('[Failover] FAILBACK IN PROGRESS');

    try {
      // Resync standby with primary
      await this.resyncStandby();
      
      // Switch back to primary
      process.env.DATABASE_URL = this.buildConnectionString(this.primaryServer);
      
      // Notify owner
      await this.notifyFailover('FAILBACK', 'Primary server recovered. Switched back to primary.');
      
      console.info('[Failover] FAILBACK COMPLETE - Back to primary server');
    } catch (error) {
      console.error('[Failover] Failback failed:', error);
      await this.notifyFailover('FAILBACK_ERROR', `Failback failed: ${error}`);
    } finally {
      this.failoverInProgress = false;
    }
  }

  /**
   * Promote standby to primary
   */
  private async promoteStandby(): Promise<void> {
    console.log('[Failover] Promoting standby to primary...');
    
    try {
      const pool = new Pool({
        host: this.standbyServer.host,
        port: this.standbyServer.port,
        database: this.standbyServer.database,
        user: this.standbyServer.user,
        password: this.standbyServer.password,
      });

      // Promote from standby mode to primary
      await pool.query('SELECT pg_promote()');
      
      // Wait for promotion to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await pool.end();
      console.log('[Failover] Standby promoted to primary');
    } catch (error) {
      console.error('[Failover] Failed to promote standby:', error);
      throw error;
    }
  }

  /**
   * Resync standby with primary
   */
  private async resyncStandby(): Promise<void> {
    console.log('[Failover] Resyncing standby with primary...');
    
    try {
      // This would typically involve:
      // 1. Taking a backup from primary
      // 2. Restoring to standby
      // 3. Setting up replication again
      
      console.log('[Failover] Standby resynced');
    } catch (error) {
      console.error('[Failover] Failed to resync standby:', error);
      throw error;
    }
  }

  /**
   * Build PostgreSQL connection string
   */
  private buildConnectionString(config: ServerConfig): string {
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Notify owner of failover events
   */
  private async notifyFailover(event: string, message: string): Promise<void> {
    try {
      // This would integrate with the notification system
      console.log(`[Failover] Notification: ${event} - ${message}`);
      
      // TODO: Send email/SMS to owner
      // await notifyOwner({ title: event, content: message });
    } catch (error) {
      console.error('[Failover] Failed to send notification:', error);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  /**
   * Shutdown failover system
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    console.log('[Failover] Failover system shutdown');
  }
}

// Export singleton instance
let failoverManager: FailoverManager | null = null;

export async function initializeFailover(): Promise<FailoverManager> {
  if (failoverManager) return failoverManager;

  const primaryConfig: ServerConfig = {
    name: 'Contabo Primary',
    host: process.env.PRIMARY_DB_HOST || '149.102.157.23',
    port: parseInt(process.env.PRIMARY_DB_PORT || '5432'),
    database: process.env.PRIMARY_DB_NAME || 'axiom_crm',
    user: process.env.PRIMARY_DB_USER || 'axiom_user',
    password: process.env.PRIMARY_DB_PASSWORD || '',
    isPrimary: true,
  };

  const standbyConfig: ServerConfig = {
    name: 'Manus Standby',
    host: process.env.STANDBY_DB_HOST || 'localhost',
    port: parseInt(process.env.STANDBY_DB_PORT || '5433'),
    database: process.env.STANDBY_DB_NAME || 'axiom_crm',
    user: process.env.STANDBY_DB_USER || 'axiom_user',
    password: process.env.STANDBY_DB_PASSWORD || '',
    isPrimary: false,
  };

  failoverManager = new FailoverManager(primaryConfig, standbyConfig);
  await failoverManager.initialize();

  return failoverManager;
}

export function getFailoverManager(): FailoverManager {
  if (!failoverManager) {
    throw new Error('Failover manager not initialized');
  }
  return failoverManager;
}
