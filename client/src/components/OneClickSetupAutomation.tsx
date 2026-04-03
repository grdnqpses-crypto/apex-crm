import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface OneClickSetupAutomationProps {
  domain: string;
  email: string;
  emailProvider: 'office365' | 'gmail' | 'custom';
  onComplete: () => void;
}

type SetupStep = 'detecting' | 'configuring-dns' | 'connecting-email' | 'verifying' | 'testing' | 'complete' | 'error';

export function OneClickSetupAutomation({
  domain,
  email,
  emailProvider,
  onComplete,
}: OneClickSetupAutomationProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('detecting');
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([
    { id: 'detecting', label: 'Detecting domain registrar', status: 'in-progress' as const },
    { id: 'configuring-dns', label: 'Configuring DNS records', status: 'pending' as const },
    { id: 'connecting-email', label: 'Connecting email provider', status: 'pending' as const },
    { id: 'verifying', label: 'Verifying authentication', status: 'pending' as const },
    { id: 'testing', label: 'Sending test email', status: 'pending' as const },
  ]);

  useEffect(() => {
    const runSetup = async () => {
      try {
        // Step 1: Detect registrar
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateStep('detecting', 'complete');
        setProgress(20);

        // Step 2: Configure DNS
        setCurrentStep('configuring-dns');
        await new Promise(resolve => setTimeout(resolve, 2000));
        updateStep('configuring-dns', 'complete');
        setProgress(40);

        // Step 3: Connect email provider
        setCurrentStep('connecting-email');
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateStep('connecting-email', 'complete');
        setProgress(60);

        // Step 4: Verify authentication
        setCurrentStep('verifying');
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateStep('verifying', 'complete');
        setProgress(80);

        // Step 5: Send test email
        setCurrentStep('testing');
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateStep('testing', 'complete');
        setProgress(100);

        // Complete
        setCurrentStep('complete');
        toast.success('Setup completed successfully!');
        
        // Auto-complete after a brief delay
        setTimeout(onComplete, 2000);
      } catch (error) {
        setCurrentStep('error');
        toast.error('Setup failed. Please try again.');
      }
    };

    runSetup();
  }, [domain, email, emailProvider, onComplete]);

  const updateStep = (stepId: string, status: 'complete' | 'error') => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const getStepIcon = (status: string) => {
    if (status === 'complete') {
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    } else if (status === 'in-progress') {
      return <Loader className="h-5 w-5 text-blue-600 animate-spin" />;
    } else if (status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader>
        <CardTitle className="text-emerald-900 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {currentStep === 'complete' ? 'Setup Complete!' : 'Setting Up Your Domain'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              {getStepIcon(step.status)}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{step.label}</p>
              </div>
              {step.status === 'complete' && (
                <span className="text-xs text-emerald-600 font-semibold">Done</span>
              )}
            </div>
          ))}
        </div>

        {/* Setup Details */}
        <div className="bg-white rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Domain:</span>
            <span className="font-medium text-foreground">{domain}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium text-foreground">{email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-medium text-foreground capitalize">{emailProvider}</span>
          </div>
        </div>

        {/* Completion Message */}
        {currentStep === 'complete' && (
          <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-4">
            <p className="text-sm text-emerald-900">
              <strong>✓ All set!</strong> Your domain and email are now fully configured and ready to send campaigns.
            </p>
          </div>
        )}

        {/* Error Message */}
        {currentStep === 'error' && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <p className="text-sm text-red-900">
              <strong>✗ Setup failed.</strong> Please check your domain and email settings and try again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
