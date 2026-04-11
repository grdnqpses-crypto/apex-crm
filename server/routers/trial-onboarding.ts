import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { TRPCError } from "@trpc/server";

export const trialOnboardingRouter = router({
  /**
   * One-click trial account creation
   * Creates company, user, and initializes sample CRM data
   */
  startTrial: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1, "Company name required"),
        fullName: z.string().min(1, "Full name required"),
        email: z.string().email("Valid email required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate unique credentials
        const username = `user_${nanoid(8)}`.toLowerCase();
        const tempPassword = nanoid(12);
        const companySlug = input.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 50);

        // Hash password
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        // Create tenant company
        const now = Date.now();
        const companyId = await db.createTenantCompany({
          name: input.companyName,
          slug: companySlug,
          subscriptionTier: "trial",
          trialEndsAt: now + 60 * 24 * 60 * 60 * 1000, // 60 days
          createdAt: now,
          updatedAt: now,
        });

        if (!companyId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create company' });

        // Create user
        const userId = await db.createCredentialUser({
          username,
          email: input.email,
          passwordHash,
          name: input.fullName,
          systemRole: "company_admin",
          tenantCompanyId: companyId ?? 0,
        });
        
        if (!userId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });

        // Initialize default CRM data
        await initializeTrialData(companyId, userId);

        // Fetch created user to return in response
        const user = await db.getUserById(userId);
        if (!user) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve user' });

        // Set session cookie using EXACT same logic as login endpoint
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, String(userId), { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            systemRole: user.systemRole,
            tenantCompanyId: user.tenantCompanyId,
          },
          companyId,
          tempPassword, // Return temp password for user to save
          message: "Trial account created successfully! You are now logged in.",
        };
      } catch (error) {
        console.error("[TRIAL ONBOARDING] Error:", error);
        throw new Error("Failed to create trial account");
      }
    }),
});

/**
 * Initialize sample CRM data for trial account
 */
async function initializeTrialData(companyId: number, userId: number) {
  try {
    // Create default pipeline with stages
    await db.createPipeline(
      userId,
      "Sales Pipeline",
      [
        { name: "Prospecting", probability: 10, color: "#3b82f6" },
        { name: "Qualified Lead", probability: 25, color: "#8b5cf6" },
        { name: "Proposal", probability: 50, color: "#ec4899" },
        { name: "Negotiation", probability: 75, color: "#f59e0b" },
        { name: "Closed Won", probability: 100, color: "#10b981" },
      ]
    );

    // Create sample company
    const sampleCompanyId = await db.createCompany({
      name: "Acme Corporation",
      industry: "Technology",
      website: "https://acme.example.com",
      employees: 500,
      annualRevenue: 50000000,
      userId,
    });

    // Create sample contacts
    const contact1Id = await db.createContact({
      userId,
      companyId: sampleCompanyId,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@acme.example.com",
      phone: "+1-555-0101",
      jobTitle: "VP of Sales",
    });

    const contact2Id = await db.createContact({
      userId,
      companyId: sampleCompanyId,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@acme.example.com",
      phone: "+1-555-0102",
      jobTitle: "Director of Operations",
    });

    // Create sample deal
    const dealId = await db.createDeal({
      userId,
      companyId: sampleCompanyId,
      contactId: contact1Id,
      name: "Enterprise Software Implementation",
      value: 250000,
      stage: "Proposal",
      probability: 50,
      expectedCloseDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      description: "Full enterprise software suite implementation with training",
    });

    // Create sample task
    await db.createTask({
      userId,
      dealId,
      contactId: contact1Id,
      title: "Follow up with John Smith",
      description: "Discuss proposal timeline and budget approval",
      dueDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
      priority: "high",
      status: "pending",
    });

    // Create sample activity
    await db.createActivity({
      userId,
      contactId: contact1Id,
      dealId,
      type: "email",
      subject: "Welcome to AXIOM CRM",
      description: "Initial outreach email sent",
    });

    console.log("[TRIAL ONBOARDING] Sample data initialized successfully");
  } catch (error) {
    console.error("[TRIAL ONBOARDING] Error initializing sample data:", error);
    // Don't throw - allow trial to proceed even if sample data fails
  }
}
