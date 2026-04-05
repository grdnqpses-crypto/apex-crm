import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Step = "provider" | "credentials" | "dns" | "verify" | "complete";

export default function EmailSetupWizard() {
  const [step, setStep] = useState<Step>("provider");
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailProvider, setEmailProvider] = useState<"office365" | "gmail" | "custom">("office365");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);

  const getProviders = trpc.emailSetupWizard.getEmailProviders.useQuery();
  const getDNSRecords = trpc.emailSetupWizard.getDNSRecords.useMutation();
  const testConnection = trpc.emailSetupWizard.testEmailConnection.useMutation();
  const completeSetup = trpc.emailSetupWizard.completeSetup.useMutation();

  const handleProviderSelect = (provider: string) => {
    setEmailProvider(provider as any);
    setStep("credentials");
    setError("");
  };

  const handleGetDNSRecords = async () => {
    if (!domain || !email) {
      setError("Please fill in domain and email");
      return;
    }
    setLoading(true);
    try {
      const result = await getDNSRecords.mutateAsync({ domain, emailProvider });
      setDnsRecords(result.records);
      setStep("dns");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!email || !password) {
      setError("Please fill in email and password");
      return;
    }
    setLoading(true);
    try {
      await testConnection.mutateAsync({ email, emailProvider, password });
      setStep("verify");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      await completeSetup.mutateAsync({ domain, email, emailProvider, password });
      setStep("complete");
      // Auto-redirect to email compose after 2 seconds
      setTimeout(() => {
        window.location.href = "/email-compose";
      }, 2000);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">📧 Email Setup Wizard</h1>
          <p className="text-slate-400">Get your email working in minutes</p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {step === "provider" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Choose Your Email Provider</h2>
            <div className="grid grid-cols-1 gap-4">
              {getProviders.data?.map((provider) => (
                <Card key={provider.id} className="p-6 cursor-pointer hover:bg-slate-700 transition" onClick={() => handleProviderSelect(provider.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{provider.icon} {provider.name}</h3>
                      <p className="text-slate-400">{provider.description}</p>
                    </div>
                    <Button>Select</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "credentials" && (
          <Card className="p-8 bg-slate-800 border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Enter Your Email Credentials</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Domain</label>
                <Input placeholder="e.g., gareversal.com" value={domain} onChange={(e) => setDomain(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Email Address</label>
                <Input type="email" placeholder="e.g., crypto@gareversal.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Password</label>
                <Input type="password" placeholder="Your email password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="flex gap-4 pt-6">
                <Button variant="outline" onClick={() => setStep("provider")}>Back</Button>
                <Button onClick={handleGetDNSRecords} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Next: View DNS Records"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === "dns" && (
          <Card className="p-8 bg-slate-800 border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Add DNS Records</h2>
            <div className="space-y-4 mb-8">
              {dnsRecords.map((record, i) => (
                <div key={i} className="bg-slate-700 p-4 rounded-lg">
                  <h4 className="font-bold text-white mb-2">{record.type} Record</h4>
                  <div className="bg-slate-800 p-2 rounded font-mono text-sm text-slate-200">Name: {record.name}</div>
                  <div className="bg-slate-800 p-2 rounded font-mono text-sm text-slate-200 mt-2">Value: {record.value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep("credentials")}>Back</Button>
              <Button onClick={handleTestConnection} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Next: Test Connection"}
              </Button>
            </div>
          </Card>
        )}

        {step === "verify" && (
          <Card className="p-8 bg-slate-800 border-slate-700">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connection Verified!</h2>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep("dns")}>Back</Button>
                <Button onClick={handleCompleteSetup} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete Setup"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === "complete" && (
          <Card className="p-8 bg-slate-800 border-slate-700">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">✅ Email Setup Complete!</h2>
              <p className="text-slate-300 mb-4">Your email is now configured and ready to use.</p>
              <p className="text-slate-400 text-sm mb-6">Opening email compose window...</p>
              <Button onClick={() => window.location.href = "/email-compose"} className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                Open Email Compose Now
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
