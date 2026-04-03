import { router, publicProcedure } from '../_core/trpc';
import { getFailoverManager } from '../failover-config';

export const healthRouter = router({
  /**
   * Get current health status of both servers
   */
  status: publicProcedure.query(async () => {
    try {
      const failoverManager = getFailoverManager();
      const healthStatus = failoverManager.getHealthStatus();

      return {
        success: true,
        timestamp: new Date(),
        servers: healthStatus,
        currentServer: process.env.DATABASE_URL?.includes('149.102.157.23')
          ? 'Contabo Primary'
          : 'Manus Standby',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  /**
   * Get detailed failover information
   */
  failoverInfo: publicProcedure.query(() => {
    return {
      primaryServer: {
        name: 'Contabo Primary',
        url: 'https://axiom-crm.com',
        ip: '149.102.157.23',
        status: 'Active',
      },
      standbyServer: {
        name: 'Manus Standby',
        url: 'https://3000-ixkdrnwsbo3eangeiznt5-c2eaf473.us2.manus.computer',
        status: 'Standby',
      },
      failoverBehavior: {
        autoFailover: true,
        checkInterval: '60 seconds',
        failoverTime: '< 2 minutes',
      },
    };
  }),
});
