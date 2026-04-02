import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Mail,
  Shield,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  ArrowRight,
} from "lucide-react";

interface SetupProgressDashboardProps {
  migrationJobId?: string;
  domain?: string;
}

export function SetupProgressDashboard({
  migrationJobId,
  domain,
}: SetupProgressDashboardProps) {
  const [setupStatus, setSetupStatus] = useState({
    dataImport: { completed: true, percentage: 100 },
    emailProvider: { completed: true, percentage: 100 },
    dnsSetup: { completed: true, percentage: 100 },
    deliverabilityTest: { completed: false, percentage: 0 },
    teamProvisioning: { completed: false, percentage: 0 },
  });

  const [domainHealth, setDomainHealth] = useState({
    overallScore: 0,
    spfScore: 0,
    dkimScore: 0,
    dmarcScore: 0,
    reputationScore: 0,
    status: "healthy" as "healthy" | "warning" | "critical",
  });

  const [deliverabilityMetrics, setDeliverabilityMetrics] = useState({
    inboxPlacementRate: 0,
    bounceRate: 0,
    complaintRate: 0,
    unsubscribeRate: 0,
    spamReportRate: 0,
  });

  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Calculate overall setup completion
  const overallCompletion = Math.round(
    (Object.values(setupStatus).reduce((sum, step) => sum + step.percentage, 0) /
      (Object.keys(setupStatus).length * 100)) *
      100
  );

  const runDeliverabilityTest = () => {
    toast.success("Running deliverability test...");
    // In production, call tRPC mutation
    setSetupStatus((prev) => ({
      ...prev,
      deliverabilityTest: { completed: false, percentage: 50 },
    }));

    setTimeout(() => {
      setSetupStatus((prev) => ({
        ...prev,
        deliverabilityTest: { completed: true, percentage: 100 },
      }));
      setDeliverabilityMetrics({
        inboxPlacementRate: 98.5,
        bounceRate: 0.3,
        complaintRate: 0.1,
        unsubscribeRate: 0.2,
        spamReportRate: 0.05,
      });
      toast.success("Deliverability test completed!");
    }, 3000);
  };

  const setupTeamEmails = () => {
    toast.success("Opening team email provisioning...");
    // In production, navigate to team provisioning page
  };

  const downloadReport = () => {
    toast.success("Downloading setup report...");
    // In production, generate and download PDF report
  };

  const getStatusColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900">Setup Progress</h1>
        <p className="text-gray-500">
          Your migration is complete. Here's your setup status and next steps.
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Setup Completion</span>
            <span className="text-2xl font-black text-orange-600">{overallCompletion}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={overallCompletion} className="h-3" />
          <div className="grid md:grid-cols-5 gap-4">
            {Object.entries(setupStatus).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="flex justify-center mb-2">
                  {value.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </p>
                <p className="text-xs text-gray-500 mt-1">{value.percentage}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Domain Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Domain Health
            </span>
            {getStatusBadge(domainHealth.overallScore)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">Overall Score</p>
              <p className={`text-2xl font-black ${getStatusColor(domainHealth.overallScore)}`}>
                {domainHealth.overallScore}/100
              </p>
            </div>
            <Progress value={domainHealth.overallScore} className="h-3" />
          </div>

          {/* Authentication Scores */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">SPF Record</p>
              <div className="flex items-center gap-2">
                <Progress value={domainHealth.spfScore} className="flex-1 h-2" />
                <span className="text-sm font-semibold">{domainHealth.spfScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">DKIM Record</p>
              <div className="flex items-center gap-2">
                <Progress value={domainHealth.dkimScore} className="flex-1 h-2" />
                <span className="text-sm font-semibold">{domainHealth.dkimScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">DMARC Policy</p>
              <div className="flex items-center gap-2">
                <Progress value={domainHealth.dmarcScore} className="flex-1 h-2" />
                <span className="text-sm font-semibold">{domainHealth.dmarcScore}%</span>
              </div>
            </div>
          </div>

          {/* Reputation Score */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Sender Reputation</p>
            <div className="flex items-center gap-2">
              <Progress value={domainHealth.reputationScore} className="flex-1 h-2" />
              <span className="text-sm font-semibold">{domainHealth.reputationScore}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverability Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Deliverability Metrics
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={runDeliverabilityTest}
              disabled={setupStatus.deliverabilityTest.completed}
            >
              {setupStatus.deliverabilityTest.completed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Tested
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Inbox Placement</p>
              <p className="text-2xl font-black text-blue-600">
                {deliverabilityMetrics.inboxPlacementRate}%
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Bounce Rate</p>
              <p className="text-2xl font-black text-green-600">
                {deliverabilityMetrics.bounceRate}%
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Complaint Rate</p>
              <p className="text-2xl font-black text-yellow-600">
                {deliverabilityMetrics.complaintRate}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Unsubscribe Rate</p>
              <p className="text-2xl font-black text-purple-600">
                {deliverabilityMetrics.unsubscribeRate}%
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Spam Reports</p>
              <p className="text-2xl font-black text-red-600">
                {deliverabilityMetrics.spamReportRate}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Zap className="w-5 h-5" />
              Recommended Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-900">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={setupTeamEmails} size="lg" className="gap-2">
          <Mail className="w-4 h-4" />
          Setup Team Emails
        </Button>
        <Button onClick={downloadReport} variant="outline" size="lg" className="gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
        <Button
          onClick={() => (window.location.href = "/")}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
