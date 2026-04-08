import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const crmGuidesRouter = {
  // Get all guides
  getGuides: protectedProcedure.input(z.object({
    category: z.string().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  })).query(async ({ ctx, input }) => {
    const guides = [
      {
        id: "guide_1",
        title: "Getting Started with Axiom Platform",
        category: "Basics",
        level: "beginner",
        duration: 15,
        sections: 8,
        description: "Learn the fundamentals of Axiom Platform including dashboard navigation, contact management, and basic workflows.",
        videoUrl: "https://example.com/videos/getting-started",
      },
      {
        id: "guide_2",
        title: "Contact Management 101",
        category: "Contacts",
        level: "beginner",
        duration: 12,
        sections: 6,
        description: "Master contact creation, organization, tagging, and bulk operations.",
        videoUrl: "https://example.com/videos/contact-mgmt",
      },
      {
        id: "guide_3",
        title: "Sales Pipeline Management",
        category: "Sales",
        level: "intermediate",
        duration: 20,
        sections: 10,
        description: "Understand deal stages, pipeline visualization, and forecasting.",
        videoUrl: "https://example.com/videos/pipeline",
      },
      {
        id: "guide_4",
        title: "Advanced Automation Workflows",
        category: "Automation",
        level: "advanced",
        duration: 30,
        sections: 15,
        description: "Build complex workflows, triggers, and automated actions.",
        videoUrl: "https://example.com/videos/automation",
      },
      {
        id: "guide_5",
        title: "Email Sequences and Campaigns",
        category: "Marketing",
        level: "intermediate",
        duration: 18,
        sections: 9,
        description: "Create and manage email sequences, track engagement, and optimize campaigns.",
        videoUrl: "https://example.com/videos/email-sequences",
      },
      {
        id: "guide_6",
        title: "Power Dialer Mastery",
        category: "Sales Tools",
        level: "intermediate",
        duration: 22,
        sections: 11,
        description: "Maximize productivity with power dialing, call scripts, and recording.",
        videoUrl: "https://example.com/videos/power-dialer",
      },
      {
        id: "guide_7",
        title: "Reputation Management Pro",
        category: "Reputation",
        level: "intermediate",
        duration: 16,
        sections: 8,
        description: "Monitor brand mentions, manage reviews, and respond strategically.",
        videoUrl: "https://example.com/videos/reputation",
      },
      {
        id: "guide_8",
        title: "Analytics and Reporting",
        category: "Analytics",
        level: "intermediate",
        duration: 19,
        sections: 10,
        description: "Create custom reports, dashboards, and data visualizations.",
        videoUrl: "https://example.com/videos/analytics",
      },
    ];

    let filtered = guides;
    if (input.category) {
      filtered = filtered.filter(g => g.category === input.category);
    }
    if (input.level) {
      filtered = filtered.filter(g => g.level === input.level);
    }

    return filtered;
  }),

  // Get guide details
  getGuideDetails: protectedProcedure.input(z.object({
    guideId: z.string(),
  })).query(async ({ ctx, input }) => {
    return {
      id: input.guideId,
      title: "Getting Started with Axiom Platform",
      category: "Basics",
      level: "beginner",
      duration: 15,
      description: "Learn the fundamentals of Axiom Platform",
      videoUrl: "https://example.com/videos/getting-started",
      sections: [
        {
          id: "sec_1",
          title: "Dashboard Overview",
          duration: 2,
          content: "Learn about the main dashboard components...",
          videoTimestamp: 0,
        },
        {
          id: "sec_2",
          title: "Navigation Basics",
          duration: 3,
          content: "Navigate through different modules...",
          videoTimestamp: 120,
        },
        {
          id: "sec_3",
          title: "Creating Your First Contact",
          duration: 4,
          content: "Step-by-step guide to adding contacts...",
          videoTimestamp: 300,
        },
      ],
      relatedGuides: ["guide_2", "guide_3"],
      completionRate: 0.75,
      rating: 4.8,
      reviews: 124,
    };
  }),

  // Get video tutorials
  getVideoTutorials: protectedProcedure.input(z.object({
    category: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    return [
      {
        id: "vid_1",
        title: "5-Minute Dashboard Tour",
        category: "Basics",
        duration: 5,
        videoUrl: "https://example.com/videos/dashboard-tour",
        thumbnail: "https://example.com/thumbnails/dashboard.jpg",
        views: 12450,
      },
      {
        id: "vid_2",
        title: "Bulk Contact Import",
        category: "Contacts",
        duration: 8,
        videoUrl: "https://example.com/videos/bulk-import",
        thumbnail: "https://example.com/thumbnails/import.jpg",
        views: 8920,
      },
      {
        id: "vid_3",
        title: "Creating Automation Workflows",
        category: "Automation",
        duration: 12,
        videoUrl: "https://example.com/videos/workflows",
        thumbnail: "https://example.com/thumbnails/workflows.jpg",
        views: 15670,
      },
    ];
  }),

  // Get knowledge base articles
  getKnowledgeBase: protectedProcedure.input(z.object({
    searchQuery: z.string().optional(),
    category: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    return [
      {
        id: "kb_1",
        title: "How to set up email sync",
        category: "Email",
        content: "Step-by-step guide to connecting your email...",
        views: 5420,
        helpful: 0.92,
      },
      {
        id: "kb_2",
        title: "Understanding lead scoring",
        category: "Sales",
        content: "Learn how lead scoring works in Axiom Platform...",
        views: 3890,
        helpful: 0.88,
      },
      {
        id: "kb_3",
        title: "API documentation",
        category: "Integrations",
        content: "Complete API reference for developers...",
        views: 2100,
        helpful: 0.85,
      },
    ];
  }),

  // Get frequently asked questions
  getFAQ: protectedProcedure.input(z.object({
    category: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    return [
      {
        id: "faq_1",
        question: "How do I import contacts from another CRM?",
        answer: "You can import contacts using our bulk import feature. Go to Contacts > Import and select your CSV file...",
        category: "Contacts",
        views: 8920,
      },
      {
        id: "faq_2",
        question: "Can I customize the sales pipeline stages?",
        answer: "Yes, go to Settings > Pipeline and create custom stages for your sales process...",
        category: "Sales",
        views: 6750,
      },
      {
        id: "faq_3",
        question: "How do I set up email notifications?",
        answer: "Navigate to Settings > Notifications and configure your preferences...",
        category: "Settings",
        views: 5430,
      },
    ];
  }),

  // Get quick tips
  getQuickTips: protectedProcedure.query(async ({ ctx }) => {
    return [
      {
        id: "tip_1",
        title: "Use keyboard shortcuts",
        description: "Press '?' to see all available keyboard shortcuts",
        category: "Productivity",
      },
      {
        id: "tip_2",
        title: "Bulk actions save time",
        description: "Select multiple contacts and perform actions on all of them at once",
        category: "Efficiency",
      },
      {
        id: "tip_3",
        title: "Custom fields for flexibility",
        description: "Create custom fields to track data specific to your business",
        category: "Customization",
      },
      {
        id: "tip_4",
        title: "Automation workflows",
        description: "Set up workflows to automate repetitive tasks",
        category: "Automation",
      },
    ];
  }),

  // Get onboarding checklist
  getOnboardingChecklist: protectedProcedure.query(async ({ ctx }) => {
    return {
      items: [
        { id: 1, title: "Set up your company profile", completed: true },
        { id: 2, title: "Import your first contacts", completed: true },
        { id: 3, title: "Configure email sync", completed: false },
        { id: 4, title: "Set up sales pipeline", completed: false },
        { id: 5, title: "Create automation workflows", completed: false },
        { id: 6, title: "Invite team members", completed: false },
        { id: 7, title: "Configure integrations", completed: false },
        { id: 8, title: "Set up reporting", completed: false },
      ],
      completionRate: 0.25,
      estimatedTimeRemaining: 120, // minutes
    };
  }),

  // Mark guide as completed
  markGuideCompleted: protectedProcedure.input(z.object({
    guideId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    return {
      success: true,
      guideId: input.guideId,
      completedAt: Date.now(),
    };
  }),

  // Submit guide feedback
  submitGuideFeedback: protectedProcedure.input(z.object({
    guideId: z.string(),
    rating: z.number().min(1).max(5),
    feedback: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    return {
      success: true,
      message: "Thank you for your feedback!",
    };
  }),

  // Get learning path
  getLearningPath: protectedProcedure.input(z.object({
    role: z.enum(["sales", "marketing", "admin", "support"]),
  })).query(async ({ ctx, input }) => {
    const paths = {
      sales: [
        { order: 1, guideId: "guide_1", title: "Getting Started" },
        { order: 2, guideId: "guide_2", title: "Contact Management" },
        { order: 3, guideId: "guide_3", title: "Sales Pipeline" },
        { order: 4, guideId: "guide_6", title: "Power Dialer" },
      ],
      marketing: [
        { order: 1, guideId: "guide_1", title: "Getting Started" },
        { order: 2, guideId: "guide_5", title: "Email Campaigns" },
        { order: 3, guideId: "guide_8", title: "Analytics" },
      ],
      admin: [
        { order: 1, guideId: "guide_1", title: "Getting Started" },
        { order: 2, guideId: "guide_4", title: "Advanced Automation" },
        { order: 3, guideId: "guide_8", title: "Analytics & Reporting" },
      ],
      support: [
        { order: 1, guideId: "guide_1", title: "Getting Started" },
        { order: 2, guideId: "guide_2", title: "Contact Management" },
        { order: 3, guideId: "guide_7", title: "Reputation Management" },
      ],
    };

    return paths[input.role] || [];
  }),
};
