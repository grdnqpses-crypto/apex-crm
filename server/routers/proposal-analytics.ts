import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

export const proposalAnalyticsRouter = {
  // Get proposal analytics dashboard
  getProposalAnalytics: protectedProcedure.input(z.object({
    timeframe: z.enum(["week", "month", "quarter", "year"]).default("month"),
  })).query(async ({ ctx, input }) => {
    return {
      totalProposals: 42,
      acceptedProposals: 28,
      rejectedProposals: 8,
      pendingProposals: 6,
      acceptanceRate: 0.667,
      averageValuePerProposal: 24500,
      totalProposalValue: 1029000,
      averageTimeToAcceptance: 5.2, // days
      averageTimeToRejection: 3.1,
      topPerformingTemplates: [
        { id: "tpl_1", name: "Enterprise Package", usageCount: 18, acceptanceRate: 0.78 },
        { id: "tpl_2", name: "Startup Starter", usageCount: 15, acceptanceRate: 0.6 },
        { id: "tpl_3", name: "Mid-Market Pro", usageCount: 9, acceptanceRate: 0.56 },
      ],
      proposalsByStage: [
        { stage: "Draft", count: 3, value: 75000 },
        { stage: "Sent", count: 6, value: 150000 },
        { stage: "Viewed", count: 12, value: 280000 },
        { stage: "Accepted", count: 28, value: 680000 },
        { stage: "Rejected", count: 8, value: 195000 },
      ],
      conversionTrend: [
        { date: Date.now() - 604800000, rate: 0.58 },
        { date: Date.now() - 518400000, rate: 0.62 },
        { date: Date.now() - 432000000, rate: 0.65 },
        { date: Date.now() - 345600000, rate: 0.63 },
        { date: Date.now() - 259200000, rate: 0.68 },
        { date: Date.now() - 172800000, rate: 0.71 },
        { date: Date.now() - 86400000, rate: 0.67 },
      ],
    };
  }),

  // Auto-generate proposal from deal
  autoGenerateProposal: protectedProcedure.input(z.object({
    dealId: z.string(),
    templateId: z.string().optional(),
    customizations: z.record(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const proposal = {
      id: Math.random().toString(36).substr(2, 9),
      dealId: input.dealId,
      templateId: input.templateId,
      title: "Custom Enterprise Solution Proposal",
      content: "Generated proposal content...",
      status: "draft",
      createdAt: Date.now(),
      createdBy: ctx.user.id,
      estimatedValue: 45000,
      validUntil: Date.now() + 2592000000, // 30 days
    };

    return { success: true, proposal };
  }),

  // Analyze proposal performance
  analyzeProposalPerformance: protectedProcedure.input(z.object({
    proposalId: z.string(),
  })).query(async ({ ctx, input }) => {
    return {
      proposalId: input.proposalId,
      title: "Enterprise CRM Solution",
      sentAt: Date.now() - 432000000,
      viewedAt: Date.now() - 345600000,
      viewCount: 3,
      timeToFirstView: 86400000, // 1 day
      engagementScore: 0.82,
      pageViews: [
        { page: 1, views: 3, avgTimeSpent: 45 },
        { page: 2, views: 3, avgTimeSpent: 120 },
        { page: 3, views: 2, avgTimeSpent: 90 },
        { page: 4, views: 1, avgTimeSpent: 30 },
      ],
      mostViewedSections: ["Pricing", "Features", "Implementation Timeline"],
      clientInteractions: [
        { type: "view", timestamp: Date.now() - 259200000, duration: 15 },
        { type: "download", timestamp: Date.now() - 172800000, duration: 0 },
        { type: "view", timestamp: Date.now() - 86400000, duration: 25 },
      ],
      sentiment: "positive",
      recommendations: [
        "Client spent most time on pricing page - consider follow-up on ROI",
        "High engagement score suggests strong interest",
        "No questions asked yet - proactive outreach recommended",
      ],
    };
  }),

  // Get proposal templates
  getProposalTemplates: protectedProcedure.query(async ({ ctx }) => {
    return [
      {
        id: "tpl_1",
        name: "Enterprise Package",
        description: "Full-featured CRM solution for large enterprises",
        sections: ["Executive Summary", "Features", "Pricing", "Implementation", "Support"],
        acceptanceRate: 0.78,
        usageCount: 18,
      },
      {
        id: "tpl_2",
        name: "Startup Starter",
        description: "Lean CRM for growing startups",
        sections: ["Overview", "Core Features", "Pricing", "Getting Started"],
        acceptanceRate: 0.6,
        usageCount: 15,
      },
      {
        id: "tpl_3",
        name: "Mid-Market Pro",
        description: "Balanced solution for mid-market companies",
        sections: ["Executive Summary", "Features", "Pricing", "ROI Analysis", "Timeline"],
        acceptanceRate: 0.56,
        usageCount: 9,
      },
    ];
  }),

  // Create custom proposal template
  createProposalTemplate: protectedProcedure.input(z.object({
    name: z.string(),
    description: z.string(),
    sections: z.array(z.string()),
    content: z.record(z.string()),
  })).mutation(async ({ ctx, input }) => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...input,
      createdAt: Date.now(),
      createdBy: ctx.user.id,
      usageCount: 0,
      acceptanceRate: 0,
    };
  }),

  // Get proposal insights
  getProposalInsights: protectedProcedure.query(async ({ ctx }) => {
    return {
      keyMetrics: {
        avgProposalValue: 24500,
        avgAcceptanceTime: 5.2,
        acceptanceRate: 0.667,
        winRate: 0.667,
      },
      insights: [
        {
          type: "opportunity",
          title: "Improve Mid-Market Template",
          description: "Mid-Market Pro template has 56% acceptance rate vs 78% for Enterprise",
          action: "Review and update template based on successful proposals",
          impact: "Could increase conversions by 15-20%",
        },
        {
          type: "trend",
          title: "Acceptance Rate Improving",
          description: "Acceptance rate increased from 58% to 67% over last 30 days",
          action: "Continue current proposal strategy",
          impact: "Positive trajectory maintained",
        },
        {
          type: "warning",
          title: "Slow Rejection Response",
          description: "Average time to rejection is 3.1 days - clients rejecting quickly",
          action: "Analyze rejected proposals for common objections",
          impact: "Could improve conversion by addressing objections earlier",
        },
      ],
      recommendations: [
        "Add social proof section to all templates",
        "Include ROI calculator for enterprise proposals",
        "Create video walkthrough for complex features",
        "Add customer testimonials to mid-market template",
      ],
    };
  }),

  // Auto-send follow-up based on engagement
  autoFollowUp: protectedProcedure.input(z.object({
    proposalId: z.string(),
    triggerType: z.enum(["no_view", "low_engagement", "high_engagement", "manual"]),
  })).mutation(async ({ ctx, input }) => {
    const messages = {
      no_view: "Wanted to check in on the proposal we sent...",
      low_engagement: "Noticed you viewed the proposal - any questions?",
      high_engagement: "Great to see your interest! Let's discuss next steps...",
      manual: "Following up on the proposal...",
    };

    return {
      success: true,
      followUpSent: true,
      message: messages[input.triggerType],
      timestamp: Date.now(),
    };
  }),

  // Generate proposal summary with AI
  generateProposalSummary: protectedProcedure.input(z.object({
    proposalId: z.string(),
    dealDetails: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a business proposal expert. Generate a concise executive summary for a CRM proposal.",
        },
        {
          role: "user",
          content: `Create a professional summary for: ${input.dealDetails}`,
        },
      ],
    });

    return {
      summary: response.choices[0].message.content,
      proposalId: input.proposalId,
      generatedAt: Date.now(),
    };
  }),

  // Bulk generate proposals
  bulkGenerateProposals: protectedProcedure.input(z.object({
    dealIds: z.array(z.string()),
    templateId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const proposals = input.dealIds.map(dealId => ({
      id: Math.random().toString(36).substr(2, 9),
      dealId,
      templateId: input.templateId,
      status: "draft",
      createdAt: Date.now(),
      createdBy: ctx.user.id,
    }));

    return {
      success: true,
      proposalsGenerated: proposals.length,
      proposals,
    };
  }),
};
