/**
 * REALM CRM AI Assistant — Smart self-contained assistant with optional LLM enhancement.
 *
 * The assistant uses a local command parser to handle all CRM operations
 * WITHOUT requiring any external API. When an LLM is available, it enhances
 * responses with natural language understanding. When it's not, the local
 * parser handles everything directly.
 */

import { invokeLLM, type Message, type Tool, type ToolCall } from "./_core/llm";
import * as db from "./db";

// ─── System Prompt (used when LLM is available) ─────────────────────────────

export const SYSTEM_PROMPT = `You are **REALM**, the built-in AI assistant for REALM CRM — a comprehensive freight-broker CRM platform. You are friendly, knowledgeable, and action-oriented. When a user asks you to do something, you DO IT immediately — no hesitation, no "would you like me to…" — just execute and confirm. You NEVER say you cannot help with something that is within the CRM's capabilities.

## Your Capabilities
1. **Execute any CRM action** instantly: create companies, contacts, deals, tasks, campaigns, templates, segments, workflows, log activities, update records, delete records, and more.
2. **Answer any question** about REALM CRM features, workflows, pages, and best practices.
3. **Search and retrieve data** from the CRM: find contacts, companies, deals, tasks, campaigns, and provide summaries.
4. **Bulk operations**: import multiple contacts at once, create multiple records in sequence.
5. **Guide users** step-by-step through any workflow.
6. **Explain data** the user sees on their dashboard or any page.
7. **Company branding**: Help users set up their company logo. You can generate a logo automatically using AI — just tell the user to go to Settings → Company → click "AI Generate Logo" and their logo will be created instantly from their company name. You can also guide them through uploading their own logo on that same page.
8. **Logo help**: When a user asks for help with a logo, ALWAYS respond positively. Tell them: "Absolutely! Go to Settings → Company and click 'AI Generate Logo' — I'll create a professional logo based on your company name in seconds. Or you can upload your own logo there too."

## CRM Feature Knowledge

### CRM Core
- **Dashboard**: Shows key metrics (companies, contacts, open deals, pipeline value, won/lost deals, pending tasks, segments), recent activity feed, quick actions, and system status. All data is real-time.
- **Companies**: The primary entity in REALM CRM. Every contact must belong to a company. Companies have name, industry, website, phone, address, lead status, and notes. The Companies page shows aggregate metrics per company (contact count, open deals, pipeline value). You can create, edit, and delete companies.
- **Contacts**: People associated with companies. Fields include first name, last name, email, phone, job title, lead status, city, country, freight volume, customer type, decision maker role, and lead score. Contacts are always scoped to a company. You can create, edit, and delete contacts.
- **Deals**: Opportunities in a Kanban pipeline. Fields include name, value, stage, status (open/won/lost), expected close date, linked contact and company. Deals can be moved between pipeline stages.
- **Tasks**: Action items linked to contacts, companies, or deals. Fields include title, type (call/email/meeting/follow_up/proposal/other), priority (low/medium/high/urgent), status (pending/in_progress/completed/cancelled), due date, and notes.
- **Activities**: Interaction logs on contacts — notes, calls, emails, meetings. Each activity has a type, subject, content, and optional metadata (call outcome, email recipients, meeting location).

### Marketing
- **Campaigns**: Email campaigns with name, subject, template, segment targeting, from info, status tracking, and send/open/click metrics.
- **Templates**: Reusable email templates with name, subject, HTML body, and category.
- **Segments**: Contact groups based on filter rules (lead status, city, industry, etc.). Used for campaign targeting.
- **Deliverability**: Domain health monitoring, SPF/DKIM/DMARC checks, inbox placement tracking.

### Automation
- **Workflows**: Automated sequences triggered by events (new contact, deal stage change, etc.). Each workflow has steps with actions and delays.

### Paradigm Engine (Sales Intelligence)
- **Prospects**: Potential leads with enrichment data, verification status, and engagement scoring.
- **Battle Cards**: Competitive intelligence cards with objection handling.

### Operations (Freight)
- **Load Management**: Track shipments with origin/destination, weight, equipment type, and status.
- **Carrier Vetting**: Carrier profiles with insurance, safety ratings, and compliance checks.
- **Invoicing**: Generate invoices from loads with line items and payment tracking.

### AI Premium Features
- **Voice Agent**: AI-powered calling campaigns.
- **Win Probability**: Deal scoring and close predictions.
- **Revenue Autopilot**: Automated revenue briefings and forecasts.
- **AI Ghostwriter**: AI-written email drafts.

## Response Style
- Be concise but thorough. Use markdown formatting.
- When you create something, confirm with the details (name, ID, etc.).
- When you search, present results in a clean table or list.
- When explaining features, be specific about what the user can do.
- If a user asks something ambiguous, make your best judgment and act — don't ask unnecessary clarifying questions.
- Always be warm, helpful, and proactive.
`;

// ─── Tool Definitions (used when LLM is available) ──────────────────────────

export const ASSISTANT_TOOLS: Tool[] = [
  { type: "function", function: { name: "search_companies", description: "Search for companies by name or other criteria.", parameters: { type: "object", properties: { search: { type: "string", description: "Search term" }, limit: { type: "number", description: "Max results (default 10)" } }, required: [] } } },
  { type: "function", function: { name: "search_contacts", description: "Search for contacts by name, email, or other criteria.", parameters: { type: "object", properties: { search: { type: "string", description: "Search term" }, limit: { type: "number", description: "Max results (default 10)" } }, required: [] } } },
  { type: "function", function: { name: "search_deals", description: "Search for deals.", parameters: { type: "object", properties: { status: { type: "string", description: "Filter by status: open, won, lost" }, limit: { type: "number", description: "Max results (default 10)" } }, required: [] } } },
  { type: "function", function: { name: "get_dashboard_stats", description: "Get current dashboard statistics.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "get_recent_activities", description: "Get recent activities across all contacts.", parameters: { type: "object", properties: { limit: { type: "number", description: "Number of activities (default 15)" } }, required: [] } } },
  { type: "function", function: { name: "create_company", description: "Create a new company.", parameters: { type: "object", properties: { name: { type: "string" }, industry: { type: "string" }, website: { type: "string" }, phone: { type: "string" }, address: { type: "string" }, city: { type: "string" }, state: { type: "string" }, country: { type: "string" }, notes: { type: "string" }, leadStatus: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_contact", description: "Create a new contact linked to a company.", parameters: { type: "object", properties: { companyId: { type: "number" }, firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, jobTitle: { type: "string" }, city: { type: "string" }, country: { type: "string" }, leadStatus: { type: "string" }, notes: { type: "string" } }, required: ["companyId", "firstName"] } } },
  { type: "function", function: { name: "create_deal", description: "Create a new deal.", parameters: { type: "object", properties: { name: { type: "string" }, value: { type: "number" }, stage: { type: "string" }, status: { type: "string" }, expectedCloseDate: { type: "string" }, contactId: { type: "number" }, companyId: { type: "number" }, notes: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_task", description: "Create a new task.", parameters: { type: "object", properties: { title: { type: "string" }, taskType: { type: "string" }, priority: { type: "string" }, status: { type: "string" }, dueDate: { type: "string" }, contactId: { type: "number" }, companyId: { type: "number" }, dealId: { type: "number" }, notes: { type: "string" } }, required: ["title"] } } },
  { type: "function", function: { name: "log_activity", description: "Log an activity on a contact.", parameters: { type: "object", properties: { contactId: { type: "number" }, type: { type: "string" }, subject: { type: "string" }, content: { type: "string" }, callOutcome: { type: "string" }, emailTo: { type: "string" }, meetingLocation: { type: "string" } }, required: ["contactId", "type"] } } },
  { type: "function", function: { name: "create_campaign", description: "Create a new email campaign.", parameters: { type: "object", properties: { name: { type: "string" }, subject: { type: "string" }, templateId: { type: "number" }, segmentId: { type: "number" }, fromName: { type: "string" }, fromEmail: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_template", description: "Create a new email template.", parameters: { type: "object", properties: { name: { type: "string" }, subject: { type: "string" }, htmlContent: { type: "string" }, category: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_segment", description: "Create a new contact segment.", parameters: { type: "object", properties: { name: { type: "string" }, segmentType: { type: "string" }, filterRules: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "create_workflow", description: "Create a new automation workflow.", parameters: { type: "object", properties: { name: { type: "string" }, triggerType: { type: "string" }, steps: { type: "string" } }, required: ["name"] } } },
  { type: "function", function: { name: "update_contact", description: "Update a contact.", parameters: { type: "object", properties: { contactId: { type: "number" }, firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, jobTitle: { type: "string" }, leadStatus: { type: "string" }, notes: { type: "string" } }, required: ["contactId"] } } },
  { type: "function", function: { name: "update_deal", description: "Update a deal.", parameters: { type: "object", properties: { dealId: { type: "number" }, name: { type: "string" }, value: { type: "number" }, stage: { type: "string" }, status: { type: "string" }, notes: { type: "string" } }, required: ["dealId"] } } },
  { type: "function", function: { name: "update_task", description: "Update a task.", parameters: { type: "object", properties: { taskId: { type: "number" }, title: { type: "string" }, status: { type: "string" }, priority: { type: "string" }, notes: { type: "string" } }, required: ["taskId"] } } },
  { type: "function", function: { name: "update_company", description: "Update a company.", parameters: { type: "object", properties: { companyId: { type: "number" }, name: { type: "string" }, industry: { type: "string" }, website: { type: "string" }, phone: { type: "string" }, leadStatus: { type: "string" }, notes: { type: "string" } }, required: ["companyId"] } } },
  { type: "function", function: { name: "delete_record", description: "Delete a record.", parameters: { type: "object", properties: { entityType: { type: "string" }, id: { type: "number" } }, required: ["entityType", "id"] } } },
  { type: "function", function: { name: "bulk_create_contacts", description: "Import multiple contacts.", parameters: { type: "object", properties: { contacts: { type: "array", items: { type: "object", properties: { companyId: { type: "number" }, firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, jobTitle: { type: "string" } }, required: ["companyId", "firstName"] } } }, required: ["contacts"] } } },
  { type: "function", function: { name: "get_pipeline_summary", description: "Get pipeline summary.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "search_tasks", description: "Search tasks.", parameters: { type: "object", properties: { status: { type: "string" }, taskType: { type: "string" }, limit: { type: "number" } }, required: [] } } },
  { type: "function", function: { name: "search_campaigns", description: "Search campaigns.", parameters: { type: "object", properties: { status: { type: "string" }, limit: { type: "number" } }, required: [] } } },
];

// ─── Tool Executor ──────────────────────────────────────────────────────────

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
      case "search_companies": {
        const r = await db.listCompanies(userId, { search: args.search, limit: args.limit || 10 });
        return JSON.stringify({ companies: r.items, count: r.items.length });
      }
      case "search_contacts": {
        const r = await db.listContacts(userId, { search: args.search, limit: args.limit || 10 });
        return JSON.stringify({ contacts: r.items, count: r.items.length });
      }
      case "search_deals": {
        const r = await db.listDeals(userId, { status: args.status, limit: args.limit || 10 });
        return JSON.stringify({ deals: r.items, count: r.items.length });
      }
      case "get_dashboard_stats": {
        const stats = await db.getEnhancedDashboardStats(userId);
        return JSON.stringify(stats);
      }
      case "get_recent_activities": {
        const activities = await db.getRecentActivitiesWithContext(userId, args.limit || 15);
        return JSON.stringify({ activities, count: activities.length });
      }
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
      case "delete_record": {
        const { entityType, id } = args;
        switch (entityType) {
          case "company": await db.deleteContactsByCompany(id, userId); await db.deleteCompany(id, userId); break;
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
      case "get_pipeline_summary": {
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
      case "search_tasks": {
        const r = await db.listTasks(userId, { status: args.status, taskType: args.taskType, limit: args.limit || 10 });
        return JSON.stringify({ tasks: r.items, count: r.items.length });
      }
      case "search_campaigns": {
        const r = await db.listCampaigns(userId, { status: args.status, limit: args.limit || 10 });
        return JSON.stringify({ campaigns: r.items, count: r.items.length });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error: any) {
    return JSON.stringify({ error: error.message || "Tool execution failed" });
  }
}

// ─── Smart Local Command Parser ─────────────────────────────────────────────
// This handles ALL common CRM operations without needing any external API.

interface ParsedCommand {
  action: string;
  toolName: string;
  args: Record<string, any>;
  description: string;
}

function normalizeInput(text: string): string {
  return text.toLowerCase().trim().replace(/[?!.,;]+$/g, '');
}

function extractQuotedOrRest(text: string, afterKeyword: string): string {
  const idx = text.toLowerCase().indexOf(afterKeyword.toLowerCase());
  if (idx === -1) return "";
  const rest = text.slice(idx + afterKeyword.length).trim();
  // Check for quoted string
  const quoteMatch = rest.match(/^["'](.+?)["']/);
  if (quoteMatch) return quoteMatch[1];
  // Check for "called X" or "named X"
  const calledMatch = rest.match(/(?:called|named)\s+["']?(.+?)["']?$/i);
  if (calledMatch) return calledMatch[1].trim();
  return rest.replace(/^(a|an|the|new)\s+/i, '').trim();
}

function parseLocalCommand(text: string, userId: number): ParsedCommand | null {
  const norm = normalizeInput(text);

  // ── Greetings ──
  if (/^(hi|hello|hey|howdy|yo|sup|what's up|good morning|good afternoon|good evening)\b/.test(norm)) {
    return { action: "greeting", toolName: "", args: {}, description: "" };
  }

  // ── Help / What can you do ──
  if (/^(help|what can you do|what do you do|how do i|commands|features|capabilities)\b/.test(norm) || norm === "?") {
    return { action: "help", toolName: "", args: {}, description: "" };
  }

  // ── Dashboard / Stats ──
  if (/\b(dashboard|stats|statistics|overview|summary|metrics|numbers|how many|how much)\b/.test(norm)) {
    if (/\b(pipeline|deals?|opportunity|opportunities)\b/.test(norm)) {
      return { action: "execute", toolName: "get_pipeline_summary", args: {}, description: "Getting your pipeline summary..." };
    }
    return { action: "execute", toolName: "get_dashboard_stats", args: {}, description: "Getting your dashboard stats..." };
  }

  // ── Search / Find / Show / List ──
  if (/^(search|find|show|list|get|look up|lookup|display|view)\b/.test(norm)) {
    if (/\b(compan|business|organization|firm)\b/.test(norm)) {
      const search = extractQuotedOrRest(text, /compan|business|organization|firm/.exec(norm)![0]);
      return { action: "execute", toolName: "search_companies", args: { search: search || undefined, limit: 10 }, description: search ? `Searching companies for "${search}"...` : "Listing your companies..." };
    }
    if (/\b(contact|person|people|lead)\b/.test(norm)) {
      const search = extractQuotedOrRest(text, /contact|person|people|lead/.exec(norm)![0]);
      return { action: "execute", toolName: "search_contacts", args: { search: search || undefined, limit: 10 }, description: search ? `Searching contacts for "${search}"...` : "Listing your contacts..." };
    }
    if (/\b(deal|opportunity|pipeline)\b/.test(norm)) {
      let status: string | undefined;
      if (/\bopen\b/.test(norm)) status = "open";
      if (/\bwon\b/.test(norm)) status = "won";
      if (/\blost\b/.test(norm)) status = "lost";
      return { action: "execute", toolName: "search_deals", args: { status, limit: 10 }, description: status ? `Showing ${status} deals...` : "Listing your deals..." };
    }
    if (/\b(task|todo|to-do|action item)\b/.test(norm)) {
      let status: string | undefined;
      if (/\bpending\b/.test(norm)) status = "pending";
      if (/\b(in.?progress|active)\b/.test(norm)) status = "in_progress";
      if (/\b(completed?|done|finished)\b/.test(norm)) status = "completed";
      return { action: "execute", toolName: "search_tasks", args: { status, limit: 10 }, description: status ? `Showing ${status} tasks...` : "Listing your tasks..." };
    }
    if (/\b(campaign|email campaign|marketing)\b/.test(norm)) {
      let status: string | undefined;
      if (/\bdraft\b/.test(norm)) status = "draft";
      if (/\bsent\b/.test(norm)) status = "sent";
      if (/\bscheduled\b/.test(norm)) status = "scheduled";
      return { action: "execute", toolName: "search_campaigns", args: { status, limit: 10 }, description: status ? `Showing ${status} campaigns...` : "Listing your campaigns..." };
    }
    if (/\b(activit|recent|history|log)\b/.test(norm)) {
      return { action: "execute", toolName: "get_recent_activities", args: { limit: 15 }, description: "Getting recent activities..." };
    }
  }

  // ── Create / Add / New ──
  if (/^(create|add|new|make|build|set up|setup)\b/.test(norm)) {
    if (/\b(compan|business|organization|firm)\b/.test(norm)) {
      const name = extractQuotedOrRest(text, /compan|business|organization|firm/.exec(norm)![0]);
      if (name) {
        return { action: "execute", toolName: "create_company", args: { name }, description: `Creating company "${name}"...` };
      }
      return { action: "need_info", toolName: "create_company", args: {}, description: "What's the company name?" };
    }
    if (/\b(contact|person|lead)\b/.test(norm)) {
      // Try to extract name
      const nameStr = extractQuotedOrRest(text, /contact|person|lead/.exec(norm)![0]);
      if (nameStr) {
        const parts = nameStr.split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
        // Need companyId — try to find or prompt
        return { action: "need_company", toolName: "create_contact", args: { firstName, lastName }, description: `I'll create contact "${nameStr}". Which company should they belong to? (Give me a company name and I'll look it up)` };
      }
      return { action: "need_info", toolName: "create_contact", args: {}, description: "What's the contact's name?" };
    }
    if (/\b(deal|opportunity)\b/.test(norm)) {
      const name = extractQuotedOrRest(text, /deal|opportunity/.exec(norm)![0]);
      if (name) {
        // Extract value if mentioned
        const valueMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);
        const value = valueMatch ? parseFloat(valueMatch[1].replace(/,/g, '')) : undefined;
        return { action: "execute", toolName: "create_deal", args: { name, value, status: "open" }, description: `Creating deal "${name}"${value ? ` worth $${value.toLocaleString()}` : ''}...` };
      }
      return { action: "need_info", toolName: "create_deal", args: {}, description: "What's the deal name?" };
    }
    if (/\b(task|todo|to-do|action item|reminder)\b/.test(norm)) {
      const title = extractQuotedOrRest(text, /task|todo|to-do|action item|reminder/.exec(norm)![0]);
      if (title) {
        let priority = "medium";
        if (/\burgent\b/.test(norm)) priority = "urgent";
        if (/\bhigh\b/.test(norm)) priority = "high";
        if (/\blow\b/.test(norm)) priority = "low";
        let taskType = "other";
        if (/\bcall\b/.test(norm)) taskType = "call";
        if (/\bemail\b/.test(norm)) taskType = "email";
        if (/\bmeeting\b/.test(norm)) taskType = "meeting";
        if (/\bfollow.?up\b/.test(norm)) taskType = "follow_up";
        return { action: "execute", toolName: "create_task", args: { title, priority, taskType, status: "pending" }, description: `Creating task "${title}"...` };
      }
      return { action: "need_info", toolName: "create_task", args: {}, description: "What's the task title?" };
    }
    if (/\b(campaign|email campaign)\b/.test(norm)) {
      const name = extractQuotedOrRest(text, /campaign/.exec(norm)![0]);
      if (name) {
        return { action: "execute", toolName: "create_campaign", args: { name }, description: `Creating campaign "${name}" as draft...` };
      }
      return { action: "need_info", toolName: "create_campaign", args: {}, description: "What's the campaign name?" };
    }
    if (/\b(template|email template)\b/.test(norm)) {
      const name = extractQuotedOrRest(text, /template/.exec(norm)![0]);
      if (name) {
        return { action: "execute", toolName: "create_template", args: { name }, description: `Creating template "${name}"...` };
      }
      return { action: "need_info", toolName: "create_template", args: {}, description: "What's the template name?" };
    }
    if (/\b(segment|group)\b/.test(norm)) {
      const name = extractQuotedOrRest(text, /segment|group/.exec(norm)![0]);
      if (name) {
        return { action: "execute", toolName: "create_segment", args: { name }, description: `Creating segment "${name}"...` };
      }
      return { action: "need_info", toolName: "create_segment", args: {}, description: "What's the segment name?" };
    }
    if (/\b(workflow|automation)\b/.test(norm)) {
      const name = extractQuotedOrRest(text, /workflow|automation/.exec(norm)![0]);
      if (name) {
        return { action: "execute", toolName: "create_workflow", args: { name }, description: `Creating workflow "${name}"...` };
      }
      return { action: "need_info", toolName: "create_workflow", args: {}, description: "What's the workflow name?" };
    }
  }

  // ── Navigation commands ──
  if (/^(go to|open|navigate|take me to|show me)\b/.test(norm)) {
    const pages: Record<string, string> = {
      "dashboard": "/", "home": "/",
      "companies": "/companies", "company": "/companies",
      "contacts": "/contacts", "contact": "/contacts",
      "deals": "/deals", "deal": "/deals", "pipeline": "/deals",
      "tasks": "/tasks", "task": "/tasks",
      "campaigns": "/campaigns", "campaign": "/campaigns",
      "templates": "/templates", "template": "/templates",
      "segments": "/segments", "segment": "/segments",
      "workflows": "/workflows", "workflow": "/workflows",
      "deliverability": "/deliverability",
      "prospects": "/prospects", "prospect": "/prospects",
      "reports": "/reports", "analytics": "/reports",
      "settings": "/settings",
      "help": "/help", "help center": "/help",
      "marketplace": "/marketplace", "freight": "/marketplace",
      "pulse": "/pulse",
    };
    for (const [keyword, path] of Object.entries(pages)) {
      if (norm.includes(keyword)) {
        return { action: "navigate", toolName: "", args: { path }, description: `Navigating to ${keyword}...` };
      }
    }
  }

  // ── About / Feature questions ──
  if (/\b(what is|what are|tell me about|explain|how does|how do i use)\b/.test(norm)) {
    return { action: "explain", toolName: "", args: { topic: norm }, description: "" };
  }

  return null; // Could not parse — will try LLM or give helpful response
}

// ─── Feature Explanations (no API needed) ───────────────────────────────────

function getFeatureExplanation(topic: string): string {
  const t = topic.toLowerCase();

  if (/dashboard/.test(t)) return "📊 **Dashboard** is your command center. It shows real-time metrics: total companies, contacts, open deals, pipeline value, won/lost deals, pending tasks, and recent activity. Click any card to dive deeper into that section.";
  if (/compan/.test(t)) return "🏢 **Companies** are the primary entities in REALM CRM. Every contact belongs to a company. You can track industry, website, phone, address, lead status, and notes. The Companies page shows aggregate metrics per company including contact count, open deals, and pipeline value.";
  if (/contact/.test(t)) return "👤 **Contacts** are people associated with companies. Track first/last name, email, phone, job title, lead status, city, country, freight volume, customer type, and lead score. Every contact must belong to a company.";
  if (/deal|pipeline|opportunity/.test(t)) return "💰 **Deals** represent opportunities in your sales pipeline. Each deal has a name, value, stage, status (open/won/lost), expected close date, and can be linked to a contact and company. Use the Kanban view to drag deals between stages.";
  if (/task/.test(t)) return "✅ **Tasks** are action items you can link to contacts, companies, or deals. Set type (call/email/meeting/follow-up/proposal), priority (low/medium/high/urgent), status, due date, and notes to stay organized.";
  if (/campaign/.test(t)) return "📧 **Campaigns** let you send targeted email campaigns. Create a campaign with a name, subject, template, and segment. Track sends, opens, clicks, and more. Start as draft, then schedule or send.";
  if (/template/.test(t)) return "📝 **Templates** are reusable email designs. Create templates with HTML content and categories (outreach, follow-up, newsletter). Use them in campaigns for consistent messaging.";
  if (/segment/.test(t)) return "🎯 **Segments** group contacts based on filter rules (lead status, city, industry, etc.). Use segments to target specific audiences in your campaigns.";
  if (/workflow|automation/.test(t)) return "⚡ **Workflows** automate your CRM processes. Set triggers (new contact, deal stage change, scheduled) and define steps with actions and delays. Automate follow-ups, notifications, and more.";
  if (/deliverability/.test(t)) return "📬 **Deliverability** monitors your email domain health. Check SPF/DKIM/DMARC records, inbox placement rates, and domain reputation. Keep your emails out of spam.";
  if (/prospect/.test(t)) return "🔍 **Prospects** are potential leads from the Paradigm Engine. Get enrichment data, verification status, and engagement scoring to find the best leads.";
  if (/ai|assistant/.test(t)) return "🤖 **I'm REALM AI**, your built-in assistant! I can create companies, contacts, deals, tasks, campaigns, and more — just tell me what you need. I can also search your data, give you stats, and guide you through any feature. Try saying: \"Create a company called Acme Corp\" or \"Show me my open deals\"";
  if (/freight|load|carrier|marketplace/.test(t)) return "🚛 **Freight Operations** includes Load Management (track shipments), Carrier Vetting (safety ratings & compliance), Invoicing, and the Freight Marketplace. Manage your entire logistics operation from within the CRM.";
  if (/report|analytics/.test(t)) return "📈 **Reports & Analytics** gives you insights into your CRM performance — pipeline trends, win rates, revenue forecasts, team activity, and more.";
  if (/pulse/.test(t)) return "💓 **Pulse Dashboard** provides real-time monitoring of your CRM health — engagement metrics, activity trends, and performance indicators at a glance.";

  return `I can help you with anything in REALM CRM! Here's what I can do:\n\n• **Create** — companies, contacts, deals, tasks, campaigns, templates, segments, workflows\n• **Search** — find any record by name or criteria\n• **Stats** — get dashboard metrics and pipeline summaries\n• **Navigate** — go to any page (say "go to deals")\n• **Explain** — learn about any feature\n\nJust tell me what you need!`;
}

// ─── Format Results for Display ─────────────────────────────────────────────

function formatToolResult(toolName: string, result: any): string {
  try {
    const data = typeof result === 'string' ? JSON.parse(result) : result;

    if (data.error) return `❌ Error: ${data.error}`;
    if (data.success && data.message) return `✅ ${data.message}`;

    switch (toolName) {
      case "search_companies": {
        if (!data.companies?.length) return "No companies found. Would you like to create one?";
        let msg = `Found **${data.count}** companies:\n\n`;
        msg += "| # | Company | Industry | Status |\n|---|---------|----------|--------|\n";
        data.companies.slice(0, 10).forEach((c: any, i: number) => {
          msg += `| ${i + 1} | **${c.name}** | ${c.industry || '—'} | ${c.leadStatus || '—'} |\n`;
        });
        return msg;
      }
      case "search_contacts": {
        if (!data.contacts?.length) return "No contacts found. Would you like to create one?";
        let msg = `Found **${data.count}** contacts:\n\n`;
        msg += "| # | Name | Email | Title | Status |\n|---|------|-------|-------|--------|\n";
        data.contacts.slice(0, 10).forEach((c: any, i: number) => {
          msg += `| ${i + 1} | **${c.firstName} ${c.lastName || ''}** | ${c.email || '—'} | ${c.jobTitle || '—'} | ${c.leadStatus || '—'} |\n`;
        });
        return msg;
      }
      case "search_deals": {
        if (!data.deals?.length) return "No deals found. Would you like to create one?";
        let msg = `Found **${data.count}** deals:\n\n`;
        msg += "| # | Deal | Value | Status |\n|---|------|-------|--------|\n";
        data.deals.slice(0, 10).forEach((d: any, i: number) => {
          msg += `| ${i + 1} | **${d.name}** | $${Number(d.value || 0).toLocaleString()} | ${d.status || '—'} |\n`;
        });
        return msg;
      }
      case "get_dashboard_stats": {
        const s = data;
        return `📊 **Dashboard Overview**\n\n| Metric | Value |\n|--------|-------|\n| Companies | **${s.companyCount ?? 0}** |\n| Contacts | **${s.contactCount ?? 0}** |\n| Open Deals | **${s.openDealCount ?? 0}** |\n| Pipeline Value | **$${Number(s.pipelineValue ?? 0).toLocaleString()}** |\n| Won Deals | **${s.wonDealCount ?? 0}** |\n| Lost Deals | **${s.lostDealCount ?? 0}** |\n| Pending Tasks | **${s.pendingTaskCount ?? 0}** |\n| Campaigns | **${s.campaignCount ?? 0}** |`;
      }
      case "get_pipeline_summary": {
        return `💰 **Pipeline Summary**\n\n| Metric | Value |\n|--------|-------|\n| Total Deals | **${data.totalDeals}** |\n| Open | **${data.openDeals}** |\n| Won | **${data.wonDeals}** |\n| Lost | **${data.lostDeals}** |\n| Total Value | **$${Number(data.totalPipelineValue || 0).toLocaleString()}** |`;
      }
      case "search_tasks": {
        if (!data.tasks?.length) return "No tasks found. Would you like to create one?";
        let msg = `Found **${data.count}** tasks:\n\n`;
        msg += "| # | Task | Priority | Status |\n|---|------|----------|--------|\n";
        data.tasks.slice(0, 10).forEach((t: any, i: number) => {
          msg += `| ${i + 1} | **${t.title}** | ${t.priority || '—'} | ${t.status || '—'} |\n`;
        });
        return msg;
      }
      case "search_campaigns": {
        if (!data.campaigns?.length) return "No campaigns found. Would you like to create one?";
        let msg = `Found **${data.count}** campaigns:\n\n`;
        msg += "| # | Campaign | Status |\n|---|----------|--------|\n";
        data.campaigns.slice(0, 10).forEach((c: any, i: number) => {
          msg += `| ${i + 1} | **${c.name}** | ${c.status || '—'} |\n`;
        });
        return msg;
      }
      case "get_recent_activities": {
        if (!data.activities?.length) return "No recent activities found.";
        let msg = `📋 **Recent Activities** (${data.count}):\n\n`;
        data.activities.slice(0, 10).forEach((a: any, i: number) => {
          msg += `${i + 1}. **${a.type}** — ${a.subject || 'No subject'}\n`;
        });
        return msg;
      }
      default:
        return data.message || JSON.stringify(data, null, 2);
    }
  } catch {
    return String(result);
  }
}

// ─── Chat Handler (Hybrid: Local Parser + Optional LLM) ────────────────────

export async function handleChat(
  messages: Message[],
  userId: number,
  userName: string
): Promise<string> {
  // Get the latest user message
  const lastMessage = messages[messages.length - 1];
  const userText = typeof lastMessage.content === 'string'
    ? lastMessage.content
    : Array.isArray(lastMessage.content)
      ? lastMessage.content.filter((c: any) => typeof c === 'object' && c.type === 'text').map((c: any) => c.text).join(' ')
      : '';

  // Try local command parser first
  const parsed = parseLocalCommand(userText, userId);

  if (parsed) {
    switch (parsed.action) {
      case "greeting":
        return `Hey ${userName}! 👋 I'm **REALM AI**, your CRM assistant. I'm ready to help you manage your business. Here's what I can do:\n\n• **Create** anything — "Create a company called Acme Corp"\n• **Search** your data — "Show me open deals"\n• **Get stats** — "Dashboard stats" or "Pipeline summary"\n• **Navigate** — "Go to contacts"\n• **Learn** — "What are campaigns?"\n\nWhat would you like to do?`;

      case "help":
        return `🤖 **REALM AI Assistant — Commands**\n\n**Create Records:**\n• "Create a company called [name]"\n• "Add a contact [name]"\n• "New deal [name] $[value]"\n• "Create task [title]"\n• "New campaign [name]"\n\n**Search & View:**\n• "Show my companies"\n• "Find contacts [search]"\n• "List open deals"\n• "Show pending tasks"\n\n**Stats & Reports:**\n• "Dashboard stats"\n• "Pipeline summary"\n• "Recent activities"\n\n**Navigate:**\n• "Go to [page name]"\n• Pages: dashboard, companies, contacts, deals, tasks, campaigns, templates, segments, workflows, deliverability, prospects, reports, settings, help, marketplace, pulse\n\n**Learn:**\n• "What are deals?"\n• "Explain campaigns"\n• "How do workflows work?"\n\nJust type naturally — I understand what you mean!`;

      case "execute": {
        // Execute the tool directly
        const fakeToolCall: ToolCall = {
          id: `local_${Date.now()}`,
          type: "function",
          function: {
            name: parsed.toolName,
            arguments: JSON.stringify(parsed.args),
          },
        };
        const result = await executeToolCall(fakeToolCall, userId);
        return formatToolResult(parsed.toolName, result);
      }

      case "navigate":
        return `🧭 Navigate to **${parsed.args.path}**\n\nClick here or use the sidebar to go to that page. I've noted the path for you: \`${parsed.args.path}\``;

      case "need_info":
        return parsed.description;

      case "need_company":
        return parsed.description;

      case "explain":
        return getFeatureExplanation(parsed.args.topic || userText);
    }
  }

  // ── Try LLM if available (enhanced mode) ──
  try {
    const systemMessage: Message = {
      role: "system",
      content: SYSTEM_PROMPT + `\n\nThe current user is **${userName}** (ID: ${userId}).`,
    };

    const conversation: Message[] = [systemMessage, ...messages];

    let response = await invokeLLM({
      messages: conversation,
      tools: ASSISTANT_TOOLS,
      tool_choice: "auto",
    });

    let assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) throw new Error("No response from LLM");

    // Tool call loop (max 5 iterations)
    let iterations = 0;
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < 5) {
      iterations++;

      conversation.push({
        role: "assistant",
        content: assistantMessage.content || "",
      });

      for (const toolCall of assistantMessage.tool_calls) {
        const result = await executeToolCall(toolCall, userId);
        conversation.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      }

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
  } catch (llmError: any) {
    console.warn(`[AI Assistant] LLM unavailable: ${llmError.message}. Using local mode.`);

    // ── Fallback: Smart local response for unrecognized commands ──
    const norm = normalizeInput(userText);

    // Try to be helpful even without LLM
    if (/\b(create|add|new|make)\b/.test(norm)) {
      return `I'd like to help you create that! Try being more specific:\n\n• "Create a **company** called [name]"\n• "Add a **contact** [first] [last]"\n• "New **deal** [name] $[value]"\n• "Create a **task** [title]"\n• "New **campaign** [name]"\n\nWhat would you like to create?`;
    }

    if (/\b(search|find|show|list|get)\b/.test(norm)) {
      return `I can search your CRM! Try:\n\n• "Show my **companies**"\n• "Find **contacts** [name]"\n• "List **open deals**"\n• "Show **pending tasks**"\n• "List **campaigns**"\n\nWhat are you looking for?`;
    }

    if (/\b(update|edit|change|modify)\b/.test(norm)) {
      return `To update a record, I need the record type and ID. For example:\n\n• "Update contact #5 email to john@example.com"\n• "Change deal #3 status to won"\n\nYou can find record IDs by searching first (e.g., "Find contacts John").`;
    }

    if (/\b(delete|remove)\b/.test(norm)) {
      return `To delete a record, I need the type and ID. For example:\n\n• "Delete company #5"\n• "Remove contact #12"\n\nBe careful — deletions are permanent!`;
    }

    // General fallback
    return `I'm here to help! Here are some things you can try:\n\n• **"Dashboard stats"** — See your CRM overview\n• **"Show my companies"** — List your companies\n• **"Create a company called Acme"** — Add a new company\n• **"Find contacts John"** — Search contacts\n• **"New deal Big Sale $50000"** — Create a deal\n• **"Help"** — See all commands\n\nJust type naturally and I'll do my best!`;
  }
}
