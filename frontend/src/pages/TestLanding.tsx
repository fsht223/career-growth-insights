// src/pages/TestLanding.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Users, Clock, Shield, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ApiService from '@/services/api';
import { useTranslation } from '@/hooks/useTranslation';

const TestLanding = () => {
  const { t, language } = useTranslation();
  const { testId } = useParams();
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [existingSession, setExistingSession] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profession: '',
    gdprAccepted: false
  });

  // Use translated profession options
  let professions: string[] = [];
  try {
    const options = t('testLanding.professionOptions');
    professions = Array.isArray(options) ? options : JSON.parse(options);
  } catch {
    professions = [];
  }

  useEffect(() => {
    loadTestInfo();
  }, [testId]);

  const loadTestInfo = async () => {
    try {
      setLoading(true);
      const info = await ApiService.getTestInfo(testId!);
      setTestInfo(info);
    } catch (error) {
      console.error('Failed to load test info:', error);
      toast({
        title: t('testLanding.error'),
        description: t('testLanding.error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.gdprAccepted) {
      toast({
        title: t('testLanding.gdpr'),
        description: t('testLanding.gdpr'),
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await ApiService.registerForTest(testId!, formData);
      
      if (response.completed) {
        toast({
          title: t('testLanding.alreadyCompleted'),
          description: t('testLanding.alreadyCompleted'),
          variant: "destructive",
        });
        return;
      }

      if (response.continueFrom > 0) {
        setExistingSession(response);
        setShowContinueDialog(true);
        return;
      }

      // Save session data and navigate to questions
      localStorage.setItem('currentTestSession', JSON.stringify({
        sessionId: response.sessionId,
        testId,
        currentQuestion: 0,
        answers: {},
        motivationalButtons: [],
        userInfo: formData
      }));

      navigate(`/test/${testId}/questions`);
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      if (error.message?.includes('already completed')) {
        toast({
          title: t('testLanding.alreadyCompleted'),
          description: t('testLanding.alreadyCompleted'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('testLanding.error'),
          description: error.message || t('testLanding.error'),
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueTest = () => {
    if (existingSession) {
      localStorage.setItem('currentTestSession', JSON.stringify({
        sessionId: existingSession.sessionId,
        testId,
        currentQuestion: existingSession.continueFrom,
        answers: {},
        motivationalButtons: [],
        userInfo: formData
      }));

      navigate(`/test/${testId}/questions`);
    }
  };

  const handleStartNewTest = () => {
    toast({
      title: t('testLanding.startNew'),
      description: t('testLanding.startNew'),
      variant: "destructive",
    });
  };

  // GDPR text could be translated or kept as is for legal reasons
  const gdprText = t('testLanding.gdprText') || `...`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('testLanding.loading')}</p>
        </div>
      </div>
    );
  }

  if (!testInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">{t('testLanding.error')}</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {testInfo.projectName || t('testLanding.platform')}
              </h1>
              <p className="text-sm text-slate-600">{t('testLanding.platformSubtitle')}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            {t('testLanding.welcome')}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('testLanding.intro')}
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">{t('testLanding.time')}</h3>
              <p className="text-sm text-slate-600">{t('testLanding.timeLabel')}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-rose-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">{t('testLanding.questions')}</h3>
              <p className="text-sm text-slate-600">{t('testLanding.analysis')}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">{t('testLanding.gdpr')}</h3>
              <p className="text-sm text-slate-600">{t('testLanding.dataProtection')}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <FileText className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">{t('testLanding.pdf')}</h3>
              <p className="text-sm text-slate-600">{t('testLanding.detailedResults')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">{t('testLanding.progressSave')}</h3>
                <p className="text-blue-700 text-sm">
                  {t('testLanding.progressInfo')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="max-w-2xl mx-auto shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="text-xl text-center">
              {t('testLanding.registrationTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700">
                    {t('testLanding.firstName')} *
                  </Label>
                  <Input
                    id="firstName"
                    placeholder={t('testLanding.firstNamePlaceholder')}
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="border-slate-300 focus:border-blue-500"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700">
                    {t('testLanding.lastName')} *
                  </Label>
                  <Input
                    id="lastName"
                    placeholder={t('testLanding.lastNamePlaceholder')}
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="border-slate-300 focus:border-blue-500"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  {t('testLanding.email')} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('testLanding.emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="border-slate-300 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-slate-500">
                  {t('testLanding.emailHelper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession" className="text-slate-700">
                  {t('testLanding.profession')} *
                </Label>
                <Select
                  value={formData.profession}
                  onValueChange={(value) => setFormData({...formData, profession: value})}
                  required
                  disabled={submitting}
                >
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder={t('testLanding.professionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {professions.map((profession) => (
                      <SelectItem key={profession} value={profession}>
                        {profession}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="gdprAccepted"
                    checked={formData.gdprAccepted}
                    onCheckedChange={(checked) => setFormData({...formData, gdprAccepted: checked as boolean})}
                    className="mt-1"
                    required
                    disabled={submitting}
                  />
                  <div className="flex-1 text-sm">
                    <Label htmlFor="gdprAccepted" className="text-slate-700 cursor-pointer leading-relaxed">
                      {t('testLanding.privacyAgreement')}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button 
                            type="button" 
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                            disabled={submitting}
                          >
                            {t('testLanding.privacyPolicyLink')}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{t('testLanding.privacyPolicyTitle')}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-96">
                            <div className="text-sm text-slate-700 whitespace-pre-line pr-4">
                              {gdprText}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      {' *'}
                    </Label>
                    <p className="text-xs text-slate-500 mt-2">
                      {t('testLanding.privacyAgreementNote')}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-medium py-3 text-lg transition-all duration-200"
                disabled={!formData.gdprAccepted || submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('testLanding.startTest')}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {t('testLanding.startTest')}
                  </>
                )}
              </Button>

              {/* Additional Info */}
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  {t('testLanding.testTime', { lang: testInfo.language === 'ru' ? 'Русский' : testInfo.language === 'kz' ? 'Казахский' : 'English' })}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader className="-mb-8">
            <CardTitle className="text-lg text-slate-800">{t('testLanding.faqTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">{t('testLanding.faq1q')}</h4>
              <p className="text-sm text-slate-600">
                {t('testLanding.faq1a')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">{t('testLanding.faq2q')}</h4>
              <p className="text-sm text-slate-600">
                {t('testLanding.faq2a')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">{t('testLanding.faq3q')}</h4>
              <p className="text-sm text-slate-600">
                {t('testLanding.faq3a')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Test Dialog */}
      <AlertDialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              <span>{t('testLanding.continueDialogTitle')}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('testLanding.continueDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartNewTest}>
              {t('testLanding.startNew')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueTest}>
              <Play className="w-4 h-4 mr-2" />
              {t('testLanding.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestLanding;