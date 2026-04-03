import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

export function SignupRedesigned() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: '',
    companySize: '',
    industry: '',
    challenge: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: '',
    billingFrequency: 'monthly',
    migrationSource: 'none',
    emailProvider: 'none',
    teamEmails: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    console.log('Submitting signup:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700">
        {/* Progress Bar */}
        <div className="px-8 pt-8">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step
                      ? 'bg-emerald-500 text-white'
                      : s === step
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 transition-all ${
                      s < step ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 1 && 'Create Your Account'}
              {step === 2 && 'Tell Us About Your Business'}
              {step === 3 && 'Add Your Payment Method'}
              {step === 4 && 'Complete Your Setup'}
            </h1>
            <p className="text-slate-400">
              {step === 1 && 'Get started in minutes. 2 months free, then $49/month.'}
              {step === 2 && 'Help us customize your experience.'}
              {step === 3 && 'Secure payment to activate your account.'}
              {step === 4 && 'Import your data and configure email.'}
            </p>
          </div>
        </div>

        {/* Step 1: Account Setup */}
        {step === 1 && (
          <div className="px-8 pb-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email Address *</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Password *</label>
              <Input
                type="password"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Confirm Password *</label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Company Name *</label>
              <Input
                type="text"
                placeholder="e.g., Logistics Worldwide"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            {/* OAuth Options */}
            <div className="space-y-3">
              <p className="text-sm text-slate-400 text-center">Or sign up with</p>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                  Google
                </Button>
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                  Microsoft
                </Button>
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                  Apple
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <label htmlFor="terms" className="text-sm text-slate-400">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Business Intelligence */}
        {step === 2 && (
          <div className="px-8 pb-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Job Title *</label>
              <select
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select your role</option>
                <option value="sales-manager">Sales Manager</option>
                <option value="sales-rep">Sales Representative</option>
                <option value="marketing-manager">Marketing Manager</option>
                <option value="operations">Operations Manager</option>
                <option value="executive">Executive</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Company Size *</label>
              <select
                value={formData.companySize}
                onChange={(e) => handleInputChange('companySize', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1,000 employees</option>
                <option value="1000+">1,000+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Industry *</label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select industry</option>
                <option value="logistics">Logistics & Freight</option>
                <option value="technology">Technology</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance & Insurance</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">What's your biggest challenge?</label>
              <textarea
                placeholder="Tell us what you're trying to accomplish..."
                value={formData.challenge}
                onChange={(e) => handleInputChange('challenge', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="px-8 pb-8 space-y-6">
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-amber-400">2 months free</span>, then <span className="font-semibold">$49/month</span> (Solo plan)
              </p>
              <p className="text-xs text-slate-400 mt-2">Cancel anytime. No questions asked.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Cardholder Name *</label>
              <Input
                type="text"
                placeholder="John Smith"
                value={formData.cardName}
                onChange={(e) => handleInputChange('cardName', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Card Number *</label>
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Expiry Date *</label>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={formData.cardExpiry}
                  onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">CVC *</label>
                <Input
                  type="text"
                  placeholder="123"
                  value={formData.cardCvc}
                  onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Billing Address *</label>
              <Input
                type="text"
                placeholder="123 Main Street"
                value={formData.billingAddress}
                onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="City"
                value={formData.billingCity}
                onChange={(e) => handleInputChange('billingCity', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              <Input
                type="text"
                placeholder="State/Province"
                value={formData.billingState}
                onChange={(e) => handleInputChange('billingState', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="ZIP/Postal Code"
                value={formData.billingZip}
                onChange={(e) => handleInputChange('billingZip', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              <Input
                type="text"
                placeholder="Country"
                value={formData.billingCountry}
                onChange={(e) => handleInputChange('billingCountry', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Billing Frequency *</label>
              <select
                value={formData.billingFrequency}
                onChange={(e) => handleInputChange('billingFrequency', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="monthly">Monthly ($49/month)</option>
                <option value="annual">Annual ($490/year - Save 17%)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Setup */}
        {step === 4 && (
          <div className="px-8 pb-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Import Your Data</label>
              <select
                value={formData.migrationSource}
                onChange={(e) => handleInputChange('migrationSource', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="none">Start Fresh</option>
                <option value="hubspot">Migrate from HubSpot</option>
                <option value="salesforce">Migrate from Salesforce</option>
                <option value="pipedrive">Migrate from Pipedrive</option>
                <option value="csv">Upload CSV File</option>
              </select>
              <p className="text-xs text-slate-400 mt-2">✨ One-click migration - we'll import all your contacts, companies, and deals</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Configure Email</label>
              <select
                value={formData.emailProvider}
                onChange={(e) => handleInputChange('emailProvider', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="none">Skip for Now</option>
                <option value="gmail">Gmail / Google Workspace</option>
                <option value="office365">Office 365 / Outlook</option>
                <option value="custom">Custom SMTP</option>
              </select>
              <p className="text-xs text-slate-400 mt-2">✨ We'll auto-configure DNS records and verify deliverability</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Invite Your Team</label>
              <textarea
                placeholder="Enter email addresses separated by commas"
                value={formData.teamEmails}
                onChange={(e) => handleInputChange('teamEmails', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
              />
              <p className="text-xs text-slate-400 mt-2">We'll send invitations and auto-provision email accounts</p>
            </div>

            <div className="bg-emerald-900 border border-emerald-700 rounded-lg p-4">
              <p className="text-sm text-emerald-100">
                <span className="font-semibold">✓ Your account is ready!</span> After you complete this step, you'll be logged in and can start using AXIOM immediately.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="px-8 pb-8 flex items-center justify-between gap-4 border-t border-slate-700 pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-sm text-slate-400">
            Step {step} of 4
          </div>

          {step < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Create Account & Start Free Trial
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default SignupRedesigned;
