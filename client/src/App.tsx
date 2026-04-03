import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense } from "react";
import { trpc } from "./lib/trpc";
import { toast } from "sonner";

// ─── Emulation Banner ─────────────────────────────────────────────────────────
// Uses server-driven state (auth.me.isEmulating) so it always shows correctly
// regardless of how emulation was started — no sessionStorage dependency.
function EmulationBanner() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000, // re-check every 30s in case session changes
  });
  const utils = trpc.useUtils();

  const restoreSessionMutation = trpc.auth.restoreSession.useMutation({
    onSuccess: async (data) => {
      // Clear sessionStorage flags (legacy cleanup)
      sessionStorage.removeItem("emulation_active");
      sessionStorage.removeItem("emulation_target");
      if (data.restored) {
        toast.success("Exited emulation — returning to your account");
        // Invalidate auth.me so the banner disappears and the correct user loads
        await utils.auth.me.invalidate();
        setTimeout(() => { window.location.href = "/dashboard"; }, 600);
      } else {
        toast.info("Session expired — please log in again");
        setTimeout(() => { window.location.href = "/login"; }, 800);
      }
    },
    onError: () => {
      sessionStorage.removeItem("emulation_active");
      sessionStorage.removeItem("emulation_target");
      // Still try to restore by reloading — the server may have set the cookie
      window.location.href = "/dashboard";
    },
  });

  const isEmulating = (meQuery.data as any)?.isEmulating === true;
  const targetName = (meQuery.data as any)?.emulatingAs || (meQuery.data as any)?.name || "";

  if (!isEmulating) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, background: "#f59e0b", color: "#000", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", fontSize: "13px", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
      <span>👁 You are emulating <strong>{targetName}</strong> — all actions are performed as this user</span>
      <button
        onClick={() => restoreSessionMutation.mutate()}
        disabled={restoreSessionMutation.isPending}
        style={{ background: "#000", color: "#f59e0b", border: "none", borderRadius: 4, padding: "4px 12px", fontWeight: 700, cursor: "pointer" }}
      >
        {restoreSessionMutation.isPending ? "Exiting..." : "Exit Emulation"}
      </button>
    </div>
  );
}

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Contacts = lazy(() => import("./pages/Contacts"));
const ContactDetail = lazy(() => import("./pages/ContactDetail"));
const Leads = lazy(() => import("./pages/Leads"));
const AxiomAI = lazy(() => import("./pages/EinsteinAI"));
const Companies = lazy(() => import("./pages/Companies"));
const Deals = lazy(() => import("./pages/Deals"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Templates = lazy(() => import("./pages/Templates"));
const Deliverability = lazy(() => import("./pages/Deliverability"));
const ABTests = lazy(() => import("./pages/ABTests"));
const Workflows = lazy(() => import("./pages/Workflows"));
const Segments = lazy(() => import("./pages/Segments"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ApiKeys = lazy(() => import("./pages/ApiKeys"));
const Webhooks = lazy(() => import("./pages/Webhooks"));
const SmtpAccounts = lazy(() => import("./pages/SmtpAccounts"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const DealDetail = lazy(() => import("./pages/DealDetail"));
const ParadigmPulse = lazy(() => import("./pages/ParadigmPulse"));
const Prospects = lazy(() => import("./pages/Prospects"));
const ProspectDetail = lazy(() => import("./pages/ProspectDetail"));
const Signals = lazy(() => import("./pages/Signals"));
const WebsiteMonitor = lazy(() => import("./pages/WebsiteMonitor"));
const GhostSequences = lazy(() => import("./pages/GhostSequences"));
const BattleCards = lazy(() => import("./pages/BattleCards"));
const Integrations = lazy(() => import("./pages/Integrations"));
const ComplianceCenter = lazy(() => import("./pages/ComplianceCenter"));
const SuppressionList = lazy(() => import("./pages/SuppressionList"));
const SenderSettings = lazy(() => import("./pages/SenderSettings"));
const DomainStats = lazy(() => import("./pages/DomainStats"));
const QuantumScore = lazy(() => import("./pages/QuantumScore"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const FmcsaScanner = lazy(() => import("./pages/FmcsaScanner"));
const DevCompanies = lazy(() => import("./pages/DevCompanies"));
const DevUsers = lazy(() => import("./pages/DevUsers"));
const DevSystemHealth = lazy(() => import("./pages/DevSystemHealth"));
const DevActivityLog = lazy(() => import("./pages/DevActivityLog"));
const DevImpersonate = lazy(() => import("./pages/DevImpersonate"));
const CompanyAdmin = lazy(() => import("./pages/CompanyAdmin"));
const TeamPerformance = lazy(() => import("./pages/TeamPerformance"));
const Settings = lazy(() => import("./pages/Settings"));
const HubSpotImport = lazy(() => import("./pages/HubSpotImport"));
const DomainOptimizer = lazy(() => import("./pages/DomainOptimizer"));
const ABEngine = lazy(() => import("./pages/ABEngine"));
const VoiceAgent = lazy(() => import("./pages/VoiceAgent"));
const CarrierPackets = lazy(() => import("./pages/CarrierPackets"));
const DocScan = lazy(() => import("./pages/DocScan"));
const WinProbability = lazy(() => import("./pages/WinProbability"));
const RevenueAutopilot = lazy(() => import("./pages/RevenueAutopilot"));
const SmartNotifications = lazy(() => import("./pages/SmartNotifications"));
const AIGhostwriter = lazy(() => import("./pages/AIGhostwriter"));
const MeetingPrep = lazy(() => import("./pages/MeetingPrep"));
const LoadManagement = lazy(() => import("./pages/LoadManagement"));
const CarrierVetting = lazy(() => import("./pages/CarrierVetting"));
const Invoicing = lazy(() => import("./pages/Invoicing"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const DigitalOnboarding = lazy(() => import("./pages/DigitalOnboarding"));
const ConversationIntel = lazy(() => import("./pages/ConversationIntel"));
const B2BDatabase = lazy(() => import("./pages/B2BDatabase"));
const EmailWarmup = lazy(() => import("./pages/EmailWarmup"));
const VisitorTracking = lazy(() => import("./pages/VisitorTracking"));
const OrderEntry = lazy(() => import("./pages/OrderEntry"));
const WhiteLabel = lazy(() => import("./pages/WhiteLabel"));
const MigrationEngine = lazy(() => import("./pages/MigrationEngine"));
const MigrationWizard = lazy(() => import("./pages/MigrationWizard"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const AIEnginePanel = lazy(() => import("./pages/AIEnginePanel"));
const Subscription = lazy(() => import("./pages/Subscription"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const FreightMarketplace = lazy(() => import("./pages/FreightMarketplace"));
const AxiomAutopilot = lazy(() => import("./pages/AxiomAutopilot"));
const EmailMasking = lazy(() => import("./pages/EmailMasking"));
const Commercial = lazy(() => import("./pages/Commercial"));
const CalendarSync = lazy(() => import("./pages/CalendarSync"));
const EmailSync = lazy(() => import("./pages/EmailSync"));
const MeetingScheduler = lazy(() => import("./pages/MeetingScheduler"));
const CustomObjects = lazy(() => import("./pages/CustomObjects"));
const ReportBuilder = lazy(() => import("./pages/ReportBuilder"));
const OnboardingConcierge = lazy(() => import("./pages/OnboardingConcierge"));
const WorkflowBuilder = lazy(() => import("./pages/WorkflowBuilder"));
const IntegrationHub = lazy(() => import("./pages/IntegrationHub"));
const Proposals = lazy(() => import("./pages/Proposals"));
const Dialer = lazy(() => import("./pages/Dialer"));
const AxiomDashboard = lazy(() => import("./pages/AxiomDashboard"));
const Signup = lazy(() => import("./pages/Signup"));
const SignupRedesigned = lazy(() => import("./pages/SignupRedesigned"));
const MarketingHome = lazy(() => import("./pages/MarketingHome"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Billing = lazy(() => import("./pages/Billing"));
const CRMBible = lazy(() => import("./pages/CRMBible"));
const BillingHistory = lazy(() => import("./pages/BillingHistory"));
const EmailSetup = lazy(() => import("./pages/EmailSetup"));
const AxiomAiCredits = lazy(() => import("./pages/AxiomAiCredits"));
const AiCreditsWallet = lazy(() => import("./pages/AiCreditsWallet"));
const BusinessCategorySelector = lazy(() => import("./pages/BusinessCategorySelector"));
const ShippingReceiving = lazy(() => import("./pages/ShippingReceiving"));
const AccountsReceivable = lazy(() => import("./pages/AccountsReceivable"));
const AccountsPayable = lazy(() => import("./pages/AccountsPayable"));
const TenantBilling = lazy(() => import("./pages/TenantBilling"));
const AxiomPaymentManagement = lazy(() => import("./pages/AxiomPaymentManagement"));
const RottenDeals = lazy(() => import("./pages/RottenDeals"));
const WinLossAnalysis = lazy(() => import("./pages/WinLossAnalysis"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const SmartViews = lazy(() => import("./pages/SmartViews"));
const AccountHierarchy = lazy(() => import("./pages/AccountHierarchy"));
const TerritoryManagement = lazy(() => import("./pages/TerritoryManagement"));
const BulkActions = lazy(() => import("./pages/BulkActions"));
const SalesForecasting = lazy(() => import("./pages/SalesForecasting"));
const ProductCatalog = lazy(() => import("./pages/ProductCatalog"));
const LeadScoring = lazy(() => import("./pages/LeadScoring"));
const AINextBestAction = lazy(() => import("./pages/AINextBestAction"));
const WebFormsBuilder = lazy(() => import("./pages/WebFormsBuilder"));
const ESignature = lazy(() => import("./pages/ESignature"));
const ReputationManagement = lazy(() => import("./pages/ReputationManagement"));
const OOODetection = lazy(() => import("./pages/OOODetection"));
const EmailSequences = lazy(() => import("./pages/EmailSequences"));
const JourneyOrchestration = lazy(() => import("./pages/JourneyOrchestration"));
const WhatsAppMessaging = lazy(() => import("./pages/WhatsAppMessaging"));
const SocialScheduler = lazy(() => import("./pages/SocialScheduler"));
const PowerDialer = lazy(() => import("./pages/PowerDialer"));
const AnomalyDetection = lazy(() => import("./pages/AnomalyDetection"));
const PipelineInspection = lazy(() => import("./pages/PipelineInspection"));
const NotificationDigest = lazy(() => import("./pages/NotificationDigest"));
const ScheduledReports = lazy(() => import("./pages/ScheduledReports"));
const SSOSettings = lazy(() => import("./pages/SSOSettings"));
const CustomRoleBuilder = lazy(() => import("./pages/CustomRoleBuilder"));
const ProposalAnalytics = lazy(() => import("./pages/ProposalAnalytics"));
const AICreditUsage = lazy(() => import("./pages/AICreditUsage"));
const BulkMerge = lazy(() => import("./pages/BulkMerge"));
const WhatsAppBroadcasts = lazy(() => import("./pages/WhatsAppBroadcasts"));
const AIPostWriter = lazy(() => import("./pages/AIPostWriter"));
const ConditionalFields = lazy(() => import("./pages/ConditionalFields"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const EmailOAuthCallback = lazy(() => import("./pages/EmailOAuthCallback"));
const SMSInbox = lazy(() => import("./pages/SMSInbox"));
const GDPRTools = lazy(() => import("./pages/GDPRTools"));
const PublicBookingPage = lazy(() => import("./pages/PublicBookingPage"));
const ReschedulePage = lazy(() => import("./pages/ReschedulePage"));
const CancelBookingPage = lazy(() => import("./pages/CancelBookingPage"));
const MultiCurrencySettings = lazy(() => import("./pages/MultiCurrencySettings"));
const FreightRateConfirmation = lazy(() => import("./pages/FreightRateConfirmation"));
const PublicPortalView = lazy(() => import("./pages/PublicPortalView"));
const SocialMedia = lazy(() => import("./pages/SocialMedia"));
const BulkOperations = lazy(() => import("./pages/BulkOperations"));
const CRMGuides = lazy(() => import("./pages/CRMGuides"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/app" component={Dashboard} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/contacts/:id" component={ContactDetail} />
          <Route path="/leads" component={Leads} />
          <Route path="/ai" component={AxiomAI} />
          <Route path="/axiom-ai" component={AxiomAI} />
          <Route path="/companies" component={Companies} />
          <Route path="/deals" component={Deals} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/templates" component={Templates} />
          <Route path="/deliverability" component={Deliverability} />
          <Route path="/ab-tests" component={ABTests} />
          <Route path="/workflows" component={Workflows} />
          <Route path="/segments" component={Segments} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/api-keys" component={ApiKeys} />
          <Route path="/webhooks" component={Webhooks} />
          <Route path="/smtp-accounts" component={SmtpAccounts} />
          <Route path="/companies/:id" component={CompanyDetail} />
          <Route path="/deals/:id" component={DealDetail} />
          <Route path="/paradigm" component={ParadigmPulse} />
          <Route path="/paradigm/prospects" component={Prospects} />
          <Route path="/paradigm/prospects/:id" component={ProspectDetail} />
          <Route path="/paradigm/signals" component={Signals} />
          <Route path="/paradigm/website-monitor" component={WebsiteMonitor} />
          <Route path="/paradigm/sequences" component={GhostSequences} />
          <Route path="/paradigm/battle-cards" component={BattleCards} />
          <Route path="/paradigm/integrations" component={Integrations} />
          <Route path="/paradigm/quantum-score" component={QuantumScore} />
          <Route path="/compliance" component={ComplianceCenter} />
          <Route path="/suppression" component={SuppressionList} />
          <Route path="/sender-settings" component={SenderSettings} />
          <Route path="/domain-stats" component={DomainStats} />
          <Route path="/fmcsa-scanner" component={FmcsaScanner} />
          <Route path="/dev/companies" component={DevCompanies} />
          <Route path="/dev/users" component={DevUsers} />
          <Route path="/dev/health" component={DevSystemHealth} />
          <Route path="/dev/activity" component={DevActivityLog} />
          <Route path="/dev/impersonate" component={DevImpersonate} />
          <Route path="/team" component={CompanyAdmin} />
          <Route path="/team-performance" component={TeamPerformance} />
          <Route path="/settings" component={Settings} />
          <Route path="/billing" component={Billing} />
          <Route path="/import/hubspot" component={HubSpotImport} />
          <Route path="/domain-optimizer" component={DomainOptimizer} />
          <Route path="/ab-engine" component={ABEngine} />
          <Route path="/voice-agent" component={VoiceAgent} />
          <Route path="/carrier-packets" component={CarrierPackets} />
          <Route path="/docscan" component={DocScan} />
          <Route path="/win-probability" component={WinProbability} />
          <Route path="/revenue-autopilot" component={RevenueAutopilot} />
          <Route path="/smart-notifications" component={SmartNotifications} />
          <Route path="/ghostwriter" component={AIGhostwriter} />
          <Route path="/meeting-prep" component={MeetingPrep} />
          <Route path="/loads" component={LoadManagement} />
          <Route path="/carrier-vetting" component={CarrierVetting} />
          <Route path="/invoicing" component={Invoicing} />
          <Route path="/portal" component={CustomerPortal} />
          <Route path="/onboarding" component={DigitalOnboarding} />
          <Route path="/conversation-intel" component={ConversationIntel} />
          <Route path="/b2b-database" component={B2BDatabase} />
          <Route path="/email-warmup" component={EmailWarmup} />
          <Route path="/visitor-tracking" component={VisitorTracking} />
          <Route path="/order-entry" component={OrderEntry} />
          <Route path="/white-label" component={WhiteLabel} />
          <Route path="/migration" component={MigrationEngine} />
          <Route path="/migration/wizard" component={MigrationWizard} />
          <Route path="/system-health" component={SystemHealth} />
          <Route path="/ai-engine" component={AIEnginePanel} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/command-center" component={CommandCenter} />
          <Route path="/freight-marketplace" component={FreightMarketplace} />
          <Route path="/axiom-autopilot" component={AxiomAutopilot} />
          <Route path="/email-masking" component={EmailMasking} />
          <Route path="/commercial" component={Commercial} />
          <Route path="/calendar-sync" component={CalendarSync} />
          <Route path="/email-sync" component={EmailSync} />
          <Route path="/meeting-scheduler" component={MeetingScheduler} />
          <Route path="/custom-objects" component={CustomObjects} />
          <Route path="/report-builder" component={ReportBuilder} />
          <Route path="/onboarding-concierge" component={OnboardingConcierge} />
          <Route path="/workflow-builder" component={WorkflowBuilder} />
          <Route path="/integration-hub" component={IntegrationHub} />
          <Route path="/proposals" component={Proposals} />
          <Route path="/dialer" component={Dialer} />
          <Route path="/axiom" component={AxiomDashboard} />
          <Route path="/help" component={HelpCenter} />
          <Route path="/crm-bible" component={CRMBible} />
          <Route path="/billing-history" component={BillingHistory} />
          <Route path="/email-setup" component={EmailSetup} />
          <Route path="/axiom/ai-credits" component={AxiomAiCredits} />
          <Route path="/settings/ai-credits" component={AiCreditsWallet} />
          <Route path="/settings/business-type" component={BusinessCategorySelector} />
          <Route path="/shipping-receiving" component={ShippingReceiving} />
          <Route path="/accounts-receivable" component={AccountsReceivable} />
          <Route path="/accounts-payable" component={AccountsPayable} />
          <Route path="/settings/billing" component={TenantBilling} />
          <Route path="/axiom/payments" component={AxiomPaymentManagement} />
          <Route path="/rotten-deals" component={RottenDeals} />
          <Route path="/win-loss" component={WinLossAnalysis} />
          <Route path="/audit-logs" component={AuditLogs} />
          <Route path="/smart-views" component={SmartViews} />
          <Route path="/account-hierarchy" component={AccountHierarchy} />
          <Route path="/territories" component={TerritoryManagement} />
          <Route path="/bulk-actions" component={BulkActions} />
          <Route path="/sales-forecasting" component={SalesForecasting} />
          <Route path="/product-catalog" component={ProductCatalog} />
          <Route path="/lead-scoring" component={LeadScoring} />
          <Route path="/ai-next-best-action" component={AINextBestAction} />
          <Route path="/web-forms" component={WebFormsBuilder} />
          <Route path="/signup" component={Signup} />
      <Route path="/signup-new" component={SignupRedesigned} />
          <Route path="/reputation" component={ReputationManagement} />
          <Route path="/ooo-detection" component={OOODetection} />
          <Route path="/email-sequences" component={EmailSequences} />
          <Route path="/journey-orchestration" component={JourneyOrchestration} />
          <Route path="/whatsapp" component={WhatsAppMessaging} />
          <Route path="/social-scheduler" component={SocialScheduler} />
          <Route path="/power-dialer" component={PowerDialer} />
          <Route path="/anomaly-detection" component={AnomalyDetection} />
          <Route path="/pipeline-inspection" component={PipelineInspection} />
          <Route path="/notification-digest" component={NotificationDigest} />
          <Route path="/scheduled-reports" component={ScheduledReports} />
          <Route path="/sso-settings" component={SSOSettings} />
          <Route path="/custom-roles" component={CustomRoleBuilder} />
          <Route path="/proposal-analytics" component={ProposalAnalytics} />
          <Route path="/ai-credit-usage" component={AICreditUsage} />
          <Route path="/bulk-merge" component={BulkMerge} />
          <Route path="/whatsapp-broadcasts" component={WhatsAppBroadcasts} />
          <Route path="/ai-post-writer" component={AIPostWriter} />
          <Route path="/conditional-fields" component={ConditionalFields} />
          <Route path="/sms" component={SMSInbox} />
          <Route path="/gdpr" component={GDPRTools} />
          <Route path="/multi-currency" component={MultiCurrencySettings} />
          <Route path="/freight-rate-confirmation" component={FreightRateConfirmation} />
          <Route path="/social-media" component={SocialMedia} />
          <Route path="/bulk-operations" component={BulkOperations} />
          <Route path="/crm-guides" component={CRMGuides} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <EmulationBanner />
          <Switch>
            <Route path="/login">
              <Suspense fallback={<PageLoader />}>
                <MarketingHome loginOpen={true} />
              </Suspense>
            </Route>
            <Route path="/signup">
              <Suspense fallback={<PageLoader />}>
                <Signup />
              </Suspense>
            </Route>
            <Route path="/home">
              <Suspense fallback={<PageLoader />}>
                <MarketingHome />
              </Suspense>
            </Route>
            <Route path="/reset-password">
              <Suspense fallback={<PageLoader />}>
                <ResetPassword />
              </Suspense>
            </Route>
            <Route path="/oauth-callback">
              <Suspense fallback={<PageLoader />}>
                <OAuthCallback />
              </Suspense>
            </Route>
            <Route path="/email-oauth-callback">
              <Suspense fallback={<PageLoader />}>
                <EmailOAuthCallback />
              </Suspense>
            </Route>
            <Route path="/book/:profileId">
              <Suspense fallback={<PageLoader />}>
                <PublicBookingPage />
              </Suspense>
            </Route>
            <Route path="/reschedule/:token">
              <Suspense fallback={<PageLoader />}>
                <ReschedulePage />
              </Suspense>
            </Route>
            <Route path="/cancel/:cancelToken">
              <Suspense fallback={<PageLoader />}>
                <CancelBookingPage />
              </Suspense>
            </Route>
            <Route path="/portal/:token">
              <Suspense fallback={<PageLoader />}>
                <PublicPortalView />
              </Suspense>
            </Route>
            <Route path="/">
              <Suspense fallback={<PageLoader />}>
                <MarketingHome />
              </Suspense>
            </Route>
            <Route>
              <Router />
            </Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
