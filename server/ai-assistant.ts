/**
 * Apex CRM AI Assistant — System prompt, tool definitions, and action executor.
 *
 * The assistant is fully versed on every CRM feature and can both answer
 * questions AND take actions (create contacts, companies, deals, campaigns,
 * templates, segments, tasks, log activities, search data, bulk import, etc.)
 * on behalf of the user.
 */

import { invokeLLM, type Message, type Tool, type ToolCall } from "./_core/llm";
import * as db from "./db";

// ─── System Prompt ───────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are **Apex**, the built-in AI assistant for Apex CRM — a comprehensive freight-broker CRM platform. You are friendly, knowledgeable, and action-oriented. When a user asks you to do something, you DO IT immediately — no hesitation, no "would you like me to…" — just execute and confirm.

## Your Capabilities
1. **Execute any CRM action** instantly: create companies, contacts, deals, tasks, campaigns, templates, segments, workflows, log activities, update records, delete records, and more.
2. **Answer any question** about Apex CRM features, workflows, pages, and best practices.
3. **Search and retrieve data** from the CRM: find contacts, companies, deals, tasks, campaigns, and provide summaries.
4. **Bulk operations**: import multiple contacts at once, create multiple records in sequence.
5. **Guide users** step-by-step through any workflow.
6. **Explain data** the user sees on their dashboard or any page.

## CRM Feature Knowledge

### CRM Core
- **Dashboard**: Shows key metrics (companies, contacts, open deals, pipeline value, won/lost deals, pending tasks, segments), recent activity feed, quick actions, and system status. All data is real-time.
- **Companies**: The primary entity in Apex CRM. Every contact must belong to a company. Companies have name, industry, website, phone, address, lead status, and notes. The Companies page shows aggregate metrics per company (contact count, open deals, pipeline value). You can create, edit, and delete companies.
- **Contacts**: People associated with companies. Fields include first name, last name, email, phone, job title, lead status, city, country, freight volume, customer type, decision maker role, and lead score. Contacts are always scoped to a company. You can create, edit, and delete contacts.
- **Deals**: Opportunities in a Kanban pipeline. Fields include name, value, stage, status (open/won/lost), expected close date, linked contact and company. Deals can be moved between pipeline stages.
- **Tasks**: Action items linked to contacts, companies, or deals. Fields include title, type (call/email/meeting/follow_up/proposal/other), priority (low/medium/high/urgent), status (pending/in_progress/completed/cancelled), due date, and notes.
- **Activities**: Interaction logs on contacts — notes, calls, emails, meetings. Each activity has a type, subject, content, and optional metadata (call outcome, email recipients, meeting location).

### Marketing
- **Campaigns**: Email campaigns with name, subject, template, segment targeting, from info, status tracking, and send/open/click metrics.
- **Templates**: Reusable email templates with name, subject, HTML body, and category.
- **Segments**: Contact groups based on filter rules (lead status, city, industry, etc.). Used for campaign targeting.
- **Deliverability**: Domain health monitoring, SPF/DKIM/DMARC checks, inbox placement tracking.
- **A/B Tests**: Split testing for email subjects, content, and send times.
- **SMTP Accounts**: Email sending infrastructure with daily limits, warm-up tracking.
- **Domain Optimizer**: Automated domain health management and warm-up.
- **Email Masking**: Custom sender identities for outbound emails.

### Automation
- **Workflows**: Automated sequences triggered by events (new contact, deal stage change, etc.). Each workflow has steps with actions and delays.
- **Segments**: Dynamic contact grouping for targeted actions.

### Paradigm Engine (Sales Intelligence)
- **Prospects**: Potential leads with enrichment data, verification status, and engagement scoring.
- **Signals**: Trigger events (job changes, funding rounds, etc.) that indicate buying intent.
- **Ghost Sequences**: AI-powered email sequences with digital twin personality matching.
- **Battle Cards**: Competitive intelligence cards with objection handling.
- **Quantum Score**: Multi-dimensional prospect scoring.

### Operations (Freight)
- **Load Management**: Track shipments with origin/destination, weight, equipment type, and status.
- **Carrier Vetting**: Carrier profiles with insurance, safety ratings, and compliance checks.
- **Invoicing**: Generate invoices from loads with line items and payment tracking.
- **Customer Portal**: External access for customers to submit quotes and track shipments.

### AI Premium Features
- **Voice Agent**: AI-powered calling campaigns.
- **DocScan**: Document scanning and data extraction.
- **Win Probability**: Deal scoring and close predictions.
- **Revenue Autopilot**: Automated revenue briefings and forecasts.
- **Smart Notifications**: AI-prioritized alerts.
- **AI Ghostwriter**: AI-written email drafts.
- **Meeting Prep**: AI-generated meeting briefs.

## Response Style
- Be concise but thorough. Use markdown formatting.
- When you create something, confirm with the details (name, ID, etc.).
- When you search, present results in a clean table or list.
- When explaining features, be specific about what the user can do.
- If a user asks something ambiguous, make your best judgment and act — don't ask unnecessary clarifying questions.
- Always be warm, helpful, and proactive.
`;

// ─── Tool Definitions ────────────────────────────────────────────────────────

export const ASSISTANT_TOOLS: Tool[] = [
  // ── Search & Retrieve ──
  {
    type: "function",
    function: {
      name: "search_companies",
      description: "Search for companies by name or other criteria. Returns a list of matching companies with their details.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search term to filter companies by name" },
          limit: { type: "number", description: "Max results to return (default 10)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_contacts",
      description: "Search for contacts by name, email, or other criteria. Returns matching contacts with company info.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search term to filter contacts" },
          limit: { type: "number", description: "Max results to return (default 10)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_deals",
      description: "Search for deals. Returns matching deals with stage and value info.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: open, won, lost" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get current dashboard statistics including company count, contact count, deal metrics, pipeline value, task counts, and more.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_activities",
      description: "Get the most recent activities (notes, calls, emails, meetings) across all contacts.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of activities to return (default 15)" },
        },
        required: [],
      },
    },
  },
  // ── Create ──
  {
    type: "function",
    function: {
      name: "create_company",
      description: "Create a new company in the CRM. Returns the new company ID.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Company name (required)" },
          industry: { type: "string", description: "Industry sector" },
          website: { type: "string", description: "Company website URL" },
          phone: { type: "string", description: "Phone number" },
          address: { type: "string", description: "Street address" },
          city: { type: "string", description: "City" },
          state: { type: "string", description: "State/province" },
          country: { type: "string", description: "Country" },
          notes: { type: "string", description: "Additional notes" },
          leadStatus: { type: "string", description: "Lead status: new, contacted, qualified, proposal, negotiation, won, lost" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_contact",
      description: "Create a new contact linked to a company. companyId is required. If user provides a company name instead of ID, search for it first.",
      parameters: {
        type: "object",
        properties: {
          companyId: { type: "number", description: "ID of the company this contact belongs to (required)" },
          firstName: { type: "string", description: "First name (required)" },
          lastName: { type: "string", description: "Last name" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number" },
          jobTitle: { type: "string", description: "Job title" },
          city: { type: "string", description: "City" },
          country: { type: "string", description: "Country" },
          leadStatus: { type: "string", description: "Lead status" },
          notes: { type: "string", description: "Notes" },
        },
        required: ["companyId", "firstName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_deal",
      description: "Create a new deal/opportunity in the pipeline.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Deal name (required)" },
          value: { type: "number", description: "Deal value in dollars" },
          stage: { type: "string", description: "Pipeline stage name" },
          status: { type: "string", description: "Status: open, won, lost (default: open)" },
          expectedCloseDate: { type: "string", description: "Expected close date (ISO format)" },
          contactId: { type: "number", description: "Linked contact ID" },
          companyId: { type: "number", description: "Linked company ID" },
          notes: { type: "string", description: "Deal notes" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task linked to a contact, company, or deal.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title (required)" },
          taskType: { type: "string", description: "Type: call, email, meeting, follow_up, proposal, other" },
          priority: { type: "string", description: "Priority: low, medium, high, urgent" },
          status: { type: "string", description: "Status: pending, in_progress, completed, cancelled" },
          dueDate: { type: "string", description: "Due date (ISO format)" },
          contactId: { type: "number", description: "Linked contact ID" },
          companyId: { type: "number", description: "Linked company ID" },
          dealId: { type: "number", description: "Linked deal ID" },
          notes: { type: "string", description: "Task notes" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_activity",
      description: "Log an activity (note, call, email, meeting) on a contact.",
      parameters: {
        type: "object",
        properties: {
          contactId: { type: "number", description: "Contact ID (required)" },
          type: { type: "string", description: "Activity type: note, call, email, meeting (required)" },
          subject: { type: "string", description: "Activity subject/title" },
          content: { type: "string", description: "Activity content/body" },
          callOutcome: { type: "string", description: "For calls: connected, voicemail, no_answer, busy, wrong_number" },
          emailTo: { type: "string", description: "For emails: recipient address" },
          meetingLocation: { type: "string", description: "For meetings: location" },
        },
        required: ["contactId", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_campaign",
      description: "Create a new email campaign.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Campaign name (required)" },
          subject: { type: "string", description: "Email subject line" },
          templateId: { type: "number", description: "Email template ID to use" },
          segmentId: { type: "number", description: "Segment ID to target" },
          fromName: { type: "string", description: "Sender name" },
          fromEmail: { type: "string", description: "Sender email" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_template",
      description: "Create a new email template.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Template name (required)" },
          subject: { type: "string", description: "Default subject line" },
          htmlContent: { type: "string", description: "HTML email body content" },
          category: { type: "string", description: "Template category (e.g., outreach, follow-up, newsletter)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_segment",
      description: "Create a new contact segment for targeting.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Segment name (required)" },
          segmentType: { type: "string", description: "Type: static or dynamic (default: dynamic)" },
          filterRules: { type: "string", description: "JSON string of filter rules" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_workflow",
      description: "Create a new automation workflow.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Workflow name (required)" },
          triggerType: { type: "string", description: "Trigger: new_contact, deal_stage_change, manual, scheduled" },
          steps: { type: "string", description: "JSON string of workflow steps" },
        },
        required: ["name"],
      },
    },
  },
  // ── Update ──
  {
    type: "function",
    function: {
      name: "update_contact",
      description: "Update an existing contact's fields.",
      parameters: {
        type: "object",
        properties: {
          contactId: { type: "number", description: "Contact ID to update (required)" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          jobTitle: { type: "string" },
          leadStatus: { type: "string" },
          notes: { type: "string" },
        },
        required: ["contactId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_deal",
      description: "Update an existing deal (change stage, value, status, etc.).",
      parameters: {
        type: "object",
        properties: {
          dealId: { type: "number", description: "Deal ID to update (required)" },
          name: { type: "string" },
          value: { type: "number" },
          stage: { type: "string" },
          status: { type: "string", description: "open, won, or lost" },
          notes: { type: "string" },
        },
        required: ["dealId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update an existing task (change status, priority, etc.).",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "number", description: "Task ID to update (required)" },
          title: { type: "string" },
          status: { type: "string", description: "pending, in_progress, completed, cancelled" },
          priority: { type: "string" },
          notes: { type: "string" },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_company",
      description: "Update an existing company's fields.",
      parameters: {
        type: "object",
        properties: {
          companyId: { type: "number", description: "Company ID to update (required)" },
          name: { type: "string" },
          industry: { type: "string" },
          website: { type: "string" },
          phone: { type: "string" },
          leadStatus: { type: "string" },
          notes: { type: "string" },
        },
        required: ["companyId"],
      },
    },
  },
  // ── Delete ──
  {
    type: "function",
    function: {
      name: "delete_record",
      description: "Delete a record from the CRM. Specify the entity type and ID.",
      parameters: {
        type: "object",
        properties: {
          entityType: { type: "string", description: "Type: company, contact, deal, task, campaign, template, segment, workflow (required)" },
          id: { type: "number", description: "Record ID to delete (required)" },
        },
        required: ["entityType", "id"],
      },
    },
  },
  // ── Bulk ──
  {
    type: "function",
    function: {
      name: "bulk_create_contacts",
      description: "Import/create multiple contacts at once. All contacts must have a companyId. If user gives a company name, search for it first or create it.",
      parameters: {
        type: "object",
        properties: {
          contacts: {
            type: "array",
            description: "Array of contact objects to create",
            items: {
              type: "object",
              properties: {
                companyId: { type: "number" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                jobTitle: { type: "string" },
              },
              required: ["companyId", "firstName"],
            },
          },
        },
        required: ["contacts"],
      },
    },
  },
  // ── Pipeline Summary ──
  {
    type: "function",
    function: {
      name: "get_pipeline_summary",
      description: "Get a summary of the deal pipeline including stage breakdown, total value, and win rate.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  // ── Search Tasks ──
  {
    type: "function",
    function: {
      name: "search_tasks",
      description: "Search for tasks by status, type, or linked entity.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: pending, in_progress, completed, cancelled" },
          taskType: { type: "string", description: "Filter by type: call, email, meeting, follow_up, proposal, other" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: [],
      },
    },
  },
  // ── Search Campaigns ──
  {
    type: "function",
    function: {
      name: "search_campaigns",
      description: "Search for email campaigns by status.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: draft, scheduled, sending, sent, paused" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: [],
      },
    },
  },
];

// ─── Tool Executor ───────────────────────────────────────────────────────────

export async function executeToolCall(
  toolCall: ToolCall,
  userId: number
): Promise<string> {
  const { name, arguments: argsStr } = toolCall.function;
  let args: any;
  try {
    args = JSON.parse(argsStr);
  } catch {
    return JSON.stringify({ error: "Invalid tool arguments" });
  }

  try {
    switch (name) {
      // ── Search & Retrieve ──
      case "search_companies": {
        const compResult = await db.listCompanies(userId, {
          search: args.search,
          limit: args.limit || 10,
        });
        return JSON.stringify({ companies: compResult.items, count: compResult.items.length });
      }
      case "search_contacts": {
        const contResult = await db.listContacts(userId, {
          search: args.search,
          limit: args.limit || 10,
        });
        return JSON.stringify({ contacts: contResult.items, count: contResult.items.length });
      }
      case "search_deals": {
        const dealSearchResult = await db.listDeals(userId, {
          status: args.status,
          limit: args.limit || 10,
        });
        return JSON.stringify({ deals: dealSearchResult.items, count: dealSearchResult.items.length });
      }
      case "get_dashboard_stats": {
        const stats = await db.getEnhancedDashboardStats(userId);
        return JSON.stringify(stats);
      }
      case "get_recent_activities": {
        const activities = await db.getRecentActivitiesWithContext(userId, args.limit || 15);
        return JSON.stringify({ activities, count: activities.length });
      }
      // ── Create ──
      case "create_company": {
        const id = await db.createCompany({ ...args, userId });
        return JSON.stringify({ success: true, companyId: id, message: `Company "${args.name}" created successfully.` });
      }
      case "create_contact": {
        const id = await db.createContact({ ...args, userId });
        return JSON.stringify({ success: true, contactId: id, message: `Contact "${args.firstName}${args.lastName ? ' ' + args.lastName : ''}" created successfully.` });
      }
      case "create_deal": {
        const data: any = { ...args, userId };
        if (args.expectedCloseDate) data.expectedCloseDate = new Date(args.expectedCloseDate).getTime();
        const id = await db.createDeal(data);
        return JSON.stringify({ success: true, dealId: id, message: `Deal "${args.name}" created successfully.` });
      }
      case "create_task": {
        const data: any = { ...args, userId };
        if (args.dueDate) data.dueDate = new Date(args.dueDate).getTime();
        const id = await db.createTask(data);
        return JSON.stringify({ success: true, taskId: id, message: `Task "${args.title}" created successfully.` });
      }
      case "log_activity": {
        const id = await db.createActivity({ ...args, userId });
        return JSON.stringify({ success: true, activityId: id, message: `${args.type} activity logged on contact ${args.contactId}.` });
      }
      case "create_campaign": {
        const id = await db.createCampaign({ ...args, userId, status: "draft" });
        return JSON.stringify({ success: true, campaignId: id, message: `Campaign "${args.name}" created as draft.` });
      }
      case "create_template": {
        const id = await db.createEmailTemplate({ ...args, userId });
        return JSON.stringify({ success: true, templateId: id, message: `Template "${args.name}" created successfully.` });
      }
      case "create_segment": {
        const filterRules = args.filterRules ? (typeof args.filterRules === 'string' ? args.filterRules : JSON.stringify(args.filterRules)) : '[]';
        const id = await db.createSegment({ name: args.name, segmentType: args.segmentType || "dynamic", filterRules, userId });
        return JSON.stringify({ success: true, segmentId: id, message: `Segment "${args.name}" created successfully.` });
      }
      case "create_workflow": {
        const steps = args.steps ? (typeof args.steps === 'string' ? args.steps : JSON.stringify(args.steps)) : '[]';
        const id = await db.createWorkflow({ name: args.name, triggerType: args.triggerType || "manual", steps, userId, status: "draft" });
        return JSON.stringify({ success: true, workflowId: id, message: `Workflow "${args.name}" created successfully.` });
      }
      // ── Update ──
      case "update_contact": {
        const { contactId, ...updateData } = args;
        await db.updateContact(contactId, userId, updateData);
        return JSON.stringify({ success: true, message: `Contact ${contactId} updated successfully.` });
      }
      case "update_deal": {
        const { dealId, ...updateData } = args;
        await db.updateDeal(dealId, userId, updateData);
        return JSON.stringify({ success: true, message: `Deal ${dealId} updated successfully.` });
      }
      case "update_task": {
        const { taskId, ...updateData } = args;
        await db.updateTask(taskId, userId, updateData);
        return JSON.stringify({ success: true, message: `Task ${taskId} updated successfully.` });
      }
      case "update_company": {
        const { companyId, ...updateData } = args;
        await db.updateCompany(companyId, userId, updateData);
        return JSON.stringify({ success: true, message: `Company ${companyId} updated successfully.` });
      }
      // ── Delete ──
      case "delete_record": {
        const { entityType, id } = args;
        switch (entityType) {
          case "company":
            await db.deleteContactsByCompany(id, userId);
            await db.deleteCompany(id, userId);
            break;
          case "contact": await db.deleteContact(id, userId); break;
          case "deal": await db.deleteDeal(id, userId); break;
          case "task": await db.deleteTask(id, userId); break;
          case "campaign": await db.deleteCampaign(id, userId); break;
          case "template": await db.deleteEmailTemplate(id, userId); break;
          case "segment": await db.deleteSegment(id, userId); break;
          case "workflow": await db.deleteWorkflow(id, userId); break;
          default: return JSON.stringify({ error: `Unknown entity type: ${entityType}` });
        }
        return JSON.stringify({ success: true, message: `${entityType} #${id} deleted successfully.` });
      }
      // ── Bulk ──
      case "bulk_create_contacts": {
        const results: any[] = [];
        for (const c of args.contacts) {
          try {
            const id = await db.createContact({ ...c, userId });
            results.push({ success: true, contactId: id, name: `${c.firstName} ${c.lastName || ''}`.trim() });
          } catch (e: any) {
            results.push({ success: false, name: `${c.firstName} ${c.lastName || ''}`.trim(), error: e.message });
          }
        }
        const successCount = results.filter(r => r.success).length;
        return JSON.stringify({ success: true, created: successCount, total: args.contacts.length, results, message: `${successCount} of ${args.contacts.length} contacts imported successfully.` });
      }
      // ── Pipeline Summary ──
      case "get_pipeline_summary": {
        const stats = await db.getEnhancedDashboardStats(userId);
        const dealResult = await db.listDeals(userId, { limit: 200 });
        const deals = dealResult.items;
        const stageMap: Record<string, { count: number; value: number }> = {};
        for (const d of deals) {
          const stage = String(d.stageId || "Unknown");
          if (!stageMap[stage]) stageMap[stage] = { count: 0, value: 0 };
          stageMap[stage].count++;
          stageMap[stage].value += Number(d.value || 0);
        }
        return JSON.stringify({
          totalDeals: deals.length,
          openDeals: deals.filter((d: any) => d.status === "open").length,
          wonDeals: deals.filter((d: any) => d.status === "won").length,
          lostDeals: deals.filter((d: any) => d.status === "lost").length,
          totalPipelineValue: deals.reduce((sum: number, d: any) => sum + Number(d.value || 0), 0),
          stageBreakdown: stageMap,
        });
      }
      // ── Search Tasks ──
      case "search_tasks": {
        const taskResult = await db.listTasks(userId, {
          status: args.status,
          taskType: args.taskType,
          limit: args.limit || 10,
        });
        return JSON.stringify({ tasks: taskResult.items, count: taskResult.items.length });
      }
      // ── Search Campaigns ──
      case "search_campaigns": {
        const campResult = await db.listCampaigns(userId, {
          status: args.status,
          limit: args.limit || 10,
        });
        return JSON.stringify({ campaigns: campResult.items, count: campResult.items.length });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error: any) {
    return JSON.stringify({ error: error.message || "Tool execution failed" });
  }
}

// ─── Chat Handler ────────────────────────────────────────────────────────────

export async function handleChat(
  messages: Message[],
  userId: number,
  userName: string
): Promise<string> {
  const systemMessage: Message = {
    role: "system",
    content: SYSTEM_PROMPT + `\n\nThe current user is **${userName}** (ID: ${userId}).`,
  };

  const conversation: Message[] = [systemMessage, ...messages];

  // First LLM call
  let response = await invokeLLM({
    messages: conversation,
    tools: ASSISTANT_TOOLS,
    tool_choice: "auto",
  });

  let assistantMessage = response.choices[0]?.message;
  if (!assistantMessage) return "I'm sorry, I couldn't process that request.";

  // Tool call loop (max 5 iterations to prevent infinite loops)
  let iterations = 0;
  while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < 5) {
    iterations++;

    // Add assistant message with tool calls
    conversation.push({
      role: "assistant",
      content: assistantMessage.content || "",
    });

    // Execute each tool call and add results
    for (const toolCall of assistantMessage.tool_calls) {
      const result = await executeToolCall(toolCall, userId);
      conversation.push({
        role: "tool",
        content: result,
        tool_call_id: toolCall.id,
      });
    }

    // Call LLM again with tool results
    response = await invokeLLM({
      messages: conversation,
      tools: ASSISTANT_TOOLS,
      tool_choice: "auto",
    });

    assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) break;
  }

  const content = assistantMessage?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((c): c is { type: "text"; text: string } => typeof c === "object" && "type" in c && c.type === "text")
      .map(c => c.text)
      .join("\n");
  }
  return "Done!";
}
