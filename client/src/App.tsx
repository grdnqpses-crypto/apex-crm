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
          <Route path="/" component={Dashboard} />
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
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
