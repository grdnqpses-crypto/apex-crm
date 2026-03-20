import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense } from "react";

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Contacts = lazy(() => import("./pages/Contacts"));
const ContactDetail = lazy(() => import("./pages/ContactDetail"));
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
const ParadigmPulse = lazy(() => import("./pages/ParadigmPulse"));
const Prospects = lazy(() => import("./pages/Prospects"));
const ProspectDetail = lazy(() => import("./pages/ProspectDetail"));
const Signals = lazy(() => import("./pages/Signals"));
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
const ApexAutopilot = lazy(() => import("./pages/ApexAutopilot"));
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
const ApexDashboard = lazy(() => import("./pages/ApexDashboard"));
const Signup = lazy(() => import("./pages/Signup"));
const MarketingHome = lazy(() => import("./pages/MarketingHome"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Billing = lazy(() => import("./pages/Billing"));
const CRMBible = lazy(() => import("./pages/CRMBible"));
const BillingHistory = lazy(() => import("./pages/BillingHistory"));
const EmailSetup = lazy(() => import("./pages/EmailSetup"));
const ApexAiCredits = lazy(() => import("./pages/ApexAiCredits"));
const AiCreditsWallet = lazy(() => import("./pages/AiCreditsWallet"));
const BusinessCategorySelector = lazy(() => import("./pages/BusinessCategorySelector"));
const ShippingReceiving = lazy(() => import("./pages/ShippingReceiving"));
const AccountsReceivable = lazy(() => import("./pages/AccountsReceivable"));
const AccountsPayable = lazy(() => import("./pages/AccountsPayable"));
const TenantBilling = lazy(() => import("./pages/TenantBilling"));
const ApexPaymentManagement = lazy(() => import("./pages/ApexPaymentManagement"));
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
          <Route path="/paradigm" component={ParadigmPulse} />
          <Route path="/paradigm/prospects" component={Prospects} />
          <Route path="/paradigm/prospects/:id" component={ProspectDetail} />
          <Route path="/paradigm/signals" component={Signals} />
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
          <Route path="/apex-autopilot" component={ApexAutopilot} />
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
          <Route path="/apex" component={ApexDashboard} />
          <Route path="/help" component={HelpCenter} />
          <Route path="/crm-bible" component={CRMBible} />
          <Route path="/billing-history" component={BillingHistory} />
          <Route path="/email-setup" component={EmailSetup} />
          <Route path="/apex/ai-credits" component={ApexAiCredits} />
          <Route path="/settings/ai-credits" component={AiCreditsWallet} />
          <Route path="/settings/business-type" component={BusinessCategorySelector} />
          <Route path="/shipping-receiving" component={ShippingReceiving} />
          <Route path="/accounts-receivable" component={AccountsReceivable} />
          <Route path="/accounts-payable" component={AccountsPayable} />
          <Route path="/settings/billing" component={TenantBilling} />
          <Route path="/apex/payments" component={ApexPaymentManagement} />
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
          <Route path="/esignature" component={ESignature} />
          <Route path="/reputation" component={ReputationManagement} />
          <Route path="/ooo-detection" component={OOODetection} />
          <Route path="/email-sequences" component={EmailSequences} />
          <Route path="/journey-orchestration" component={JourneyOrchestration} />
          <Route path="/whatsapp" component={WhatsAppMessaging} />
          <Route path="/social-scheduler" component={SocialScheduler} />
          <Route path="/power-dialer" component={PowerDialer} />
          <Route path="/anomaly-detection" component={AnomalyDetection} />
          <Route path="/pipeline-inspection" component={PipelineInspection} />
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
