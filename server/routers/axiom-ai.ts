import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { db } from "../db";

export const axiomAIRouter = router({
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user's company data for context
        const company = await db.query.companies.findFirst({
          where: (companies, { eq }) =>
            eq(companies.id, ctx.user.tenantCompanyId),
        });

        // Get pipeline summary for context
        const deals = await db.query.deals.findMany({
          where: (deals, { eq }) => eq(deals.companyId, ctx.user.tenantCompanyId),
        });

        const totalPipeline = deals.reduce(
          (sum, deal) => sum + (deal.amount || 0),
          0
        );
        const openDeals = deals.filter((d) => d.stage !== "Closed Won").length;
        const wonDeals = deals.filter((d) => d.stage === "Closed Won").length;

        // Build system prompt with sales context
        const systemPrompt = `You are AXIOM AI, an intelligent sales copilot for ${company?.name || "the company"}. 
You have access to the following company data:
- Company: ${company?.name}
- Industry: ${company?.industry}
- Total Pipeline: $${(totalPipeline / 1000000).toFixed(1)}M
- Open Deals: ${openDeals}
- Won Deals: ${wonDeals}

Provide helpful, actionable sales insights and recommendations. Be concise and professional.
Focus on helping the sales team close more deals, improve pipeline health, and identify opportunities.`;

        // Prepare conversation history
        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...(input.conversationHistory || []),
          { role: "user" as const, content: input.message },
        ];

        // Call Gemini API through Manus LLM
        const response = await invokeLLM({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        const assistantMessage =
          response.choices[0]?.message?.content || "I couldn't generate a response.";

        return {
          message: assistantMessage,
          success: true,
        };
      } catch (error) {
        console.error("AXIOM AI chat error:", error);
        return {
          message:
            "I encountered an error processing your request. Please try again.",
          success: false,
        };
      }
    }),

  getInsights: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get sales data for quick insights
      const deals = await db.query.deals.findMany({
        where: (deals, { eq }) => eq(deals.companyId, ctx.user.tenantCompanyId),
      });

      const contacts = await db.query.contacts.findMany({
        where: (contacts, { eq }) =>
          eq(contacts.companyId, ctx.user.tenantCompanyId),
      });

      const totalPipeline = deals.reduce(
        (sum, deal) => sum + (deal.amount || 0),
        0
      );
      const avgDealSize = deals.length > 0 ? totalPipeline / deals.length : 0;
      const winRate =
        deals.length > 0
          ? (deals.filter((d) => d.stage === "Closed Won").length / deals.length) *
            100
          : 0;

      return {
        totalPipeline,
        avgDealSize,
        winRate: winRate.toFixed(1),
        openDeals: deals.filter((d) => d.stage !== "Closed Won").length,
        totalContacts: contacts.length,
        insights: [
          `Your average deal size is $${(avgDealSize / 1000).toFixed(0)}K`,
          `Current win rate: ${winRate.toFixed(1)}%`,
          `${contacts.length} contacts in your database`,
        ],
      };
    } catch (error) {
      console.error("Error fetching AXIOM AI insights:", error);
      return {
        totalPipeline: 0,
        avgDealSize: 0,
        winRate: "0",
        openDeals: 0,
        totalContacts: 0,
        insights: [],
      };
    }
  }),
});
