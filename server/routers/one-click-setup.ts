import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { oneClickSetup } from '../one-click-setup';

export const oneClickSetupRouter = router({
  /**
   * One-click domain and email setup
   * Automatically configures DNS, email provider, and sends test email
   */
  setupDomainAndEmail: protectedProcedure
    .input(
      z.object({
        domain: z.string().min(1, 'Domain is required'),
        email: z.string().email('Valid email required'),
        emailProvider: z.enum(['office365', 'gmail', 'custom']),
        emailPassword: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[tRPC] One-click setup initiated for ${input.domain} by user ${ctx.user.id}`);

        const result = await oneClickSetup({
          domain: input.domain,
          email: input.email,
          emailProvider: input.emailProvider,
          emailPassword: input.emailPassword,
        });

        return {
          success: result.success,
          message: result.message,
          domain: result.domain,
          email: result.email,
          emailProvider: result.emailProvider,
          dnsRecords: result.dnsRecords || [],
          verificationStatus: result.verificationStatus || {},
        };
      } catch (error) {
        console.error('[tRPC] One-click setup error:', error);
        throw new Error(`Setup failed: ${error}`);
      }
    }),

  /**
   * Check setup progress
   */
  getSetupProgress: protectedProcedure
    .input(z.object({ domain: z.string() }))
    .query(async ({ input, ctx }) => {
      // This would query the database for setup status
      return {
        domain: input.domain,
        status: 'pending', // or 'in_progress', 'completed', 'failed'
        progress: 0,
        message: 'Setup not started',
      };
    }),

  /**
   * Get setup history for user
   */
  getSetupHistory: protectedProcedure.query(async ({ ctx }) => {
    // This would query the database for all setups by this user
    return {
      setups: [],
      total: 0,
    };
  }),
});
