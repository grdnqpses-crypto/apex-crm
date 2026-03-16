import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, Circle,
  LayoutDashboard, Building2, Users, Target, Mail, BarChart3,
  Brain, Truck, Shield, Settings, Zap, ArrowRight, Lightbulb,
  GraduationCap, Trophy, Star, Rocket
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Tutorial Step Definitions ───
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  tip: string;
  icon: React.ElementType;
  route: string;
  category: "getting-started" | "crm-basics" | "advanced" | "automation" | "admin";
  requiredRole?: string[];
  action?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  // Getting Started
  {
    id: "welcome",
    title: "Welcome to Apex CRM",
    description: "Your all-in-one CRM platform is ready. Let's take a quick tour to help you get the most out of every feature.",
    tip: "This onboarding takes about 5 minutes and will save you hours of exploration.",
    icon: Rocket,
    route: "/",
    category: "getting-started",
  },
  {
    id: "dashboard-overview",
    title: "Your Command Center",
    description: "The Dashboard shows your real-time metrics — pipeline value, deal counts, task progress, and team performance at a glance.",
    tip: "Click any metric card to jump directly to that section. The greeting updates based on time of day.",
    icon: LayoutDashboard,
    route: "/",
    category: "getting-started",
  },
  {
    id: "add-company",
    title: "Add Your First Company",
    description: "Companies are the foundation of your CRM. Each company can have multiple contacts, deals, and activities linked to it.",
    tip: "Use the '+ Add Company' button to create your first account. You can import from HubSpot CSV too.",
    icon: Building2,
    route: "/companies",
    category: "crm-basics",
  },
  {
    id: "add-contacts",
    title: "Build Your Contact Database",
    description: "Contacts live under companies. Add key decision-makers, track their lifecycle stage, and log every interaction.",
    tip: "Each contact has a full timeline — notes, calls, emails, and meetings. Use lifecycle stages to track progress.",
    icon: Users,
    route: "/contacts",
    category: "crm-basics",
  },
  {
    id: "create-deal",
    title: "Track Your Deals",
    description: "Create deals to track revenue opportunities through your pipeline. Set values, stages, and expected close dates.",
    tip: "The pipeline view shows all deals by stage. Drag deals between stages or use the detail view for full control.",
    icon: Target,
    route: "/deals",
    category: "crm-basics",
  },
  {
    id: "manage-tasks",
    title: "Stay on Top of Tasks",
    description: "Tasks keep your team accountable. Create follow-ups, set due dates, and link tasks to contacts or deals.",
    tip: "Overdue tasks appear in red on your dashboard. Use the filter to see tasks by status, priority, or assignee.",
    icon: CheckCircle2,
    route: "/tasks",
    category: "crm-basics",
  },
  {
    id: "email-campaigns",
    title: "Launch Email Campaigns",
    description: "Create targeted email campaigns with templates, personalization tokens, and A/B testing to maximize engagement.",
    tip: "Our deliverability engine ensures your emails land in the inbox, not spam. Check the Deliverability tab for domain health.",
    icon: Mail,
    route: "/campaigns",
    category: "advanced",
  },
  {
    id: "analytics",
    title: "Measure Everything",
    description: "The Analytics dashboard gives you deep insights into sales performance, email metrics, and team productivity.",
    tip: "Use date filters and segment breakdowns to identify trends. Export reports for stakeholder presentations.",
    icon: BarChart3,
    route: "/analytics",
    category: "advanced",
  },
  {
    id: "paradigm-engine",
    title: "AI-Powered Prospecting",
    description: "The Paradigm Engine uses AI to discover prospects, score leads, and surface buying signals automatically.",
    tip: "Set your ideal customer profile and let the AI find matching prospects. Ghost Sequences automate outreach.",
    icon: Brain,
    route: "/paradigm",
    category: "automation",
  },
  {
    id: "team-management",
    title: "Manage Your Team",
    description: "Add team members, assign roles, and set permissions. Managers can track team performance and reassign accounts.",
    tip: "Use the Team page to create new users. Each role has specific permissions — admins see everything, reps see their own data.",
    icon: Users,
    route: "/team",
    category: "admin",
    requiredRole: ["company_admin", "manager", "apex_owner", "developer"],
  },
  {
    id: "settings",
    title: "Customize Your CRM",
    description: "Configure your company settings, branding, SMTP accounts, and integrations to make Apex CRM truly yours.",
    tip: "White-label branding lets you customize the logo, colors, and domain for your team.",
    icon: Settings,
    route: "/settings",
    category: "admin",
    requiredRole: ["company_admin", "apex_owner", "developer"],
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Congratulations! You've completed the Apex CRM onboarding. You're ready to start closing deals and growing your business.",
    tip: "Need help anytime? Click the Help Center in the sidebar or use the AI Assistant (bottom-right sparkle button).",
    icon: Trophy,
    route: "/",
    category: "getting-started",
  },
];

// ─── Onboarding Context ───
const STORAGE_KEY = "apex-onboarding";

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  completedSteps: string[];
  dismissed: boolean;
  startedAt: number;
}

function getOnboardingState(): OnboardingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    isActive: false,
    currentStep: 0,
    completedSteps: [],
    dismissed: false,
    startedAt: 0,
  };
}

function saveOnboardingState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ─── Main Onboarding Component ───
export default function OnboardingTutorial() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [state, setState] = useState<OnboardingState>(getOnboardingState);
  const [showPopup, setShowPopup] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Filter steps based on user role
  const availableSteps = useMemo(() => {
    if (!user) return TUTORIAL_STEPS;
    return TUTORIAL_STEPS.filter(step => {
      if (!step.requiredRole) return true;
      return step.requiredRole.includes(user.systemRole || user.role);
    });
  }, [user]);

  const currentStepData = availableSteps[state.currentStep] || availableSteps[0];
  const progress = ((state.currentStep) / (availableSteps.length - 1)) * 100;

  // Save state changes
  useEffect(() => {
    saveOnboardingState(state);
  }, [state]);

  // Show popup with animation
  useEffect(() => {
    if (state.isActive && !state.dismissed) {
      setShowPopup(true);
      setTimeout(() => setAnimateIn(true), 50);
    }
  }, [state.isActive, state.dismissed, state.currentStep]);

  const startTutorial = useCallback(() => {
    const newState: OnboardingState = {
      isActive: true,
      currentStep: 0,
      completedSteps: [],
      dismissed: false,
      startedAt: Date.now(),
    };
    setState(newState);
    setShowPopup(true);
    setTimeout(() => setAnimateIn(true), 50);
  }, []);

  const nextStep = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setState(prev => {
        const next = Math.min(prev.currentStep + 1, availableSteps.length - 1);
        const completed = Array.from(new Set([...prev.completedSteps, currentStepData.id]));
        return { ...prev, currentStep: next, completedSteps: completed };
      });
      // Navigate to the next step's route
      const nextStepData = availableSteps[Math.min(state.currentStep + 1, availableSteps.length - 1)];
      if (nextStepData) {
        navigate(nextStepData.route);
      }
      setTimeout(() => setAnimateIn(true), 50);
    }, 200);
  }, [availableSteps, currentStepData, state.currentStep, navigate]);

  const prevStep = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setState(prev => {
        const next = Math.max(prev.currentStep - 1, 0);
        return { ...prev, currentStep: next };
      });
      const prevStepData = availableSteps[Math.max(state.currentStep - 1, 0)];
      if (prevStepData) {
        navigate(prevStepData.route);
      }
      setTimeout(() => setAnimateIn(true), 50);
    }, 200);
  }, [availableSteps, state.currentStep, navigate]);

  const dismissTutorial = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setState(prev => ({ ...prev, dismissed: true, isActive: false }));
      setShowPopup(false);
    }, 200);
  }, []);

  const completeTutorial = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isActive: false,
        dismissed: true,
        completedSteps: availableSteps.map(s => s.id),
      }));
      setShowPopup(false);
      navigate("/");
    }, 200);
  }, [availableSteps, navigate]);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      dismissed: false,
      startedAt: 0,
    });
  }, []);

  // Expose start function globally for the Getting Started button
  useEffect(() => {
    (window as any).__startOnboarding = startTutorial;
    (window as any).__resetOnboarding = resetTutorial;
    return () => {
      delete (window as any).__startOnboarding;
      delete (window as any).__resetOnboarding;
    };
  }, [startTutorial, resetTutorial]);

  if (!showPopup || state.dismissed) return null;

  const isLastStep = state.currentStep === availableSteps.length - 1;
  const isFirstStep = state.currentStep === 0;
  const Icon = currentStepData.icon;

  const categoryColors: Record<string, string> = {
    "getting-started": "bg-blue-100 text-blue-700 border-blue-200",
    "crm-basics": "bg-green-100 text-green-700 border-green-200",
    "advanced": "bg-purple-100 text-purple-700 border-purple-200",
    "automation": "bg-amber-100 text-amber-700 border-amber-200",
    "admin": "bg-red-100 text-red-700 border-red-200",
  };

  const categoryLabels: Record<string, string> = {
    "getting-started": "Getting Started",
    "crm-basics": "CRM Basics",
    "advanced": "Advanced Features",
    "automation": "AI & Automation",
    "admin": "Administration",
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-md w-full" style={{ pointerEvents: "auto" }}>
      <div className={`transition-all duration-300 ${animateIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`}>
        <Card className="shadow-2xl border-slate-200 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <Badge className={`text-[10px] px-1.5 py-0 ${categoryColors[currentStepData.category]}`}>
                    {categoryLabels[currentStepData.category]}
                  </Badge>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Step {state.currentStep + 1} of {availableSteps.length}
                  </p>
                </div>
              </div>
              <button onClick={dismissTutorial} className="text-slate-400 hover:text-slate-600 transition p-1 -mr-1 -mt-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{currentStepData.title}</h3>
            <p className="text-sm text-slate-600 mb-3 leading-relaxed">{currentStepData.description}</p>

            {/* AI Tip */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 mb-4 border border-amber-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">{currentStepData.tip}</p>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1 mb-4">
              {availableSteps.map((step, i) => (
                <div
                  key={step.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === state.currentStep
                      ? "w-6 bg-amber-500"
                      : i < state.currentStep || state.completedSteps.includes(step.id)
                      ? "w-1.5 bg-amber-300"
                      : "w-1.5 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={isFirstStep}
                className="text-slate-500"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={dismissTutorial} className="text-slate-400 text-xs">
                  Skip Tour
                </Button>
                {isLastStep ? (
                  <Button size="sm" onClick={completeTutorial}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    <Trophy className="w-4 h-4 mr-1" /> Complete!
                  </Button>
                ) : (
                  <Button size="sm" onClick={nextStep}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Getting Started Button Component ───
export function GettingStartedButton() {
  const handleClick = () => {
    if ((window as any).__startOnboarding) {
      (window as any).__startOnboarding();
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
    >
      <GraduationCap className="w-4 h-4 mr-2" />
      Getting Started
    </Button>
  );
}
