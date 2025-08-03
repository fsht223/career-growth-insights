// src/pages/TestResults.tsx - Consistent styling version
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Mail, Star, Award, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ApiService from '@/services/api';
import { useTranslation } from '@/hooks/useTranslation';
import { useMotivationalFactorTranslation } from '@/utils/translationUtils';

const TestResults = () => {
  const { t } = useTranslation();
  const { translateMotivationalFactor } = useMotivationalFactorTranslation();
  const { testId } = useParams();
  const location = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [pdfStatus, setPdfStatus] = useState<string>('generating');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [emailSent, setEmailSent] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const savedUserData = localStorage.getItem('testUserData');
    if (savedUserData) setUserData(JSON.parse(savedUserData));

    let resultId = location.state?.resultId || localStorage.getItem('lastResultId');
    if (resultId) {
      ApiService.getReport(resultId).then(report => {

        setTestResults(report.results);
        setPdfStatus(report.pdfStatus || 'generating');
        setPdfUrl(report.pdfUrl || '');
      });
    }
  }, [location.state]);

  const handleDownloadPDF = async () => {
    const resultId = location.state?.resultId || localStorage.getItem('lastResultId');
    if (!resultId) {
      toast({
        title: t('testResults.error'),
        description: t('testResults.reportIdNotFound'),
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloading(true);
      
      const blob = await ApiService.downloadPDF(resultId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Отчет_${userData?.lastName}_${userData?.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: t('testResults.downloadComplete'),
        description: t('testResults.downloadCompleteDescription'),
      });
      
    } catch (error: any) {
      console.error('PDF download failed:', error);
      
      if (error.message.includes('still being generated')) {
        toast({
          title: t('testResults.stillGenerating'),
          description: t('testResults.stillGeneratingDescription'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('testResults.downloadError'),
          description: t('testResults.downloadErrorDescription'),
          variant: "destructive",
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    setEmailSent(true);
    toast({
      title: t('testResults.reportSent'),
      description: t('testResults.reportSentDescription', { email: userData?.email }),
    });
  };

  // Transform and sort motivation buttons by percentage (highest to lowest)
  const motivationButtons = testResults && testResults.groupScores
    ? Object.keys(testResults.groupScores)
        .map((btn) => ({
          name: btn,
          translatedName: translateMotivationalFactor(btn),
          score: testResults.groupScores[btn],
          benchmark: testResults.goldenLine[btn] || 1,
          percentage: testResults.percentages[btn] || 0,
          isStarred: testResults.starredItems && testResults.starredItems.includes(btn)
        }))
        .sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending
    : [];

  const getStatusColor = (percentage: number) => {
    if (percentage < 90) return "text-red-600";
    if (percentage > 110) return "text-red-600"; 
    return "text-green-600";
  };

  const getStatusText = (percentage: number) => {
    if (percentage < 90) return t('testResults.potentialDevelopment');
    if (percentage > 110) return t('testResults.potentialDevelopment');
    return t('testResults.alignedBenchmark');
  };

  const getBarColor = (percentage: number) => {
    if (percentage < 90) return "bg-red-500";
    if (percentage > 110) return "bg-red-500";
    return "bg-green-500";
  };

  const getPDFStatusDisplay = () => {
    switch (pdfStatus) {
      case 'generating':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: t('testResults.status.generating'),
          color: 'text-blue-600'
        };
      case 'ready':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: t('testResults.status.ready'),
          color: 'text-green-600'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: t('testResults.status.failed'),
          color: 'text-red-600'
        };
      default:
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: t('testResults.status.processing'),
          color: 'text-gray-600'
        };
    }
  };

  if (!testResults) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('testResults.processingResults')}</p>
        </div>
      </div>
    );
  }

  const firstName = userData?.firstName || testResults.testeeName?.split(' ')[0] || 'Имя';
  const lastName = userData?.lastName || testResults.testeeName?.split(' ')[1] || '';
  const profession = userData?.profession || testResults.profession || 'Профессия';

  const statusDisplay = getPDFStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Award className="w-8 h-8 text-yellow-600" />
              <h1 className="text-2xl font-bold text-slate-800">{t('testResults.testingResults')}</h1>
            </div>
            <p className="text-slate-600">
              {firstName} {lastName} • {profession}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Completion Message */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-green-800">{t('testResults.completion')}</h2>
                <p className="text-green-700">
                  {t('testResults.personalReport')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Status Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className={statusDisplay.color}>
                {statusDisplay.icon}
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">{t('testResults.pdfStatus')}</h3>
                <p className={`${statusDisplay.color} font-medium`}>
                  {statusDisplay.text}
                </p>
                {pdfStatus === 'generating' && (
                  <p className="text-blue-600 text-sm mt-1">
                    {t('testResults.pdfGenerating')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Chart - Main Section */}
        <Card className="mb-8 shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="text-xl text-center">{t('testResults.competencyProfile')}</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* Single Benchmark label at the top */}
            <div className="text-center">
              <span className="text-m font-medium text-slate-800">{t('testResults.benchmark')}</span>
            </div>
            <div className="space-y-6">
              {motivationButtons.map((result, index) => (
                <div key={index} className="space-y-3">
                  {/* Header with name, star, and percentage */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-800">{result.translatedName}</span>
                      {result.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-lg ${getStatusColor(result.percentage)}`}>
                        {Math.round(result.percentage)}%
                      </span>
                      <div className="text-xs text-slate-500">
                        {result.score}/{Math.round(result.benchmark)}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar with proper scaling */}
                  <div className="relative h-6 bg-slate-200 rounded-full overflow-hidden">
                    {/* Progress fill */}
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getBarColor(result.percentage)}`}
                      style={{ 
                        width: `${Math.min(Math.max(result.percentage, 0), 200) / 2}%` // Scale to 200% max
                      }}
                    />
                    
                    {/* Benchmark line at 100% (50% of container since we scale to 200%) - Made more prominent */}
                    <div 
                      className="absolute top-0 h-full w-0.5 bg-zinc-700 z-10 shadow-sm"
                      style={{ left: 'calc(50% - 2px)' }}
                    />
                  </div>

                  {/* Status text with 100% indicator */}
                  <div className="flex justify-between text-sm">
                    <span className={getStatusColor(result.percentage)}>
                      {getStatusText(result.percentage)}
                    </span>
                    <div className="flex space-x-4 text-slate-500">
                      <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                        100%
                      </span>
                      <span>{t('testResults.max')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-3">{t('testResults.legend')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{t('testResults.selectedMotivational')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-green-500 rounded"></div>
                  <span>{t('testResults.matchesBenchmark')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-red-500 rounded"></div>
                  <span>{t('testResults.developmentArea')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-4 bg-slate-900 rounded-sm"></div>
                  <span>{t('testResults.benchmarkLine')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Averages - Updated to match main section style */}
        <Card className="mb-8 shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="text-xl text-center">{t('testResults.motivationProfiles')}</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testResults.profileAverages && Object.entries(testResults.profileAverages).map(([profile, value]) => (
                <div key={profile} className="text-center">
                  <div className="font-semibold text-slate-800 mb-2">{translateMotivationalFactor(profile)}</div>
                  <div className="text-3xl font-bold text-blue-900 mb-2">{Math.round(value as number)}%</div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(value as number, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional metrics - Updated styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
              <CardTitle className="text-lg text-center">{t('testResults.consistencyTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {Math.round(testResults.consistency || 0)}%
              </div>
              <div className="text-slate-600 text-sm mb-4">
                {t('testResults.consistencyDescription')}
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(testResults.consistency || 0, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
              <CardTitle className="text-lg text-center">{t('testResults.awarenessTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {testResults.awarenessLevel || 0}%
              </div>
              <div className="text-slate-600 text-sm mb-4">
                {t('testResults.awarenessDescription')}
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(testResults.awarenessLevel || 0, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inner/Outer and Reasoning - Updated styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
              <CardTitle className="text-lg text-center">{t('testResults.innerOuterTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{t('testResults.inner')}</span>
                  <span className="font-bold text-lg text-blue-900">
                    {Math.round(testResults.innerOuter?.inner || 0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(testResults.innerOuter?.inner || 0, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{t('testResults.outer')}</span>
                  <span className="font-bold text-lg text-blue-900">
                    {Math.round(testResults.innerOuter?.outer || 0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(testResults.innerOuter?.outer || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
              <CardTitle className="text-lg text-center">{t('testResults.reasoningTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{t('testResults.intuition')}</span>
                  <span className="font-bold text-lg text-blue-900">
                    {Math.round(testResults.reasoning?.intuition || 0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(testResults.reasoning?.intuition || 0, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{t('testResults.logic')}</span>
                  <span className="font-bold text-lg text-blue-900">
                    {Math.round(testResults.reasoning?.beingLogical || 0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(testResults.reasoning?.beingLogical || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Development Areas - Updated styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-lg">
              <CardTitle className="text-lg text-center">{t('testResults.strengthsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {testResults.strengths && testResults.strengths.length > 0 ? (
                <div className="space-y-3">
                  {testResults.strengths.map((btn: string) => (
                    <div key={btn} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-green-800">{translateMotivationalFactor(btn)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-600 py-8">
                  {t('testResults.noStrengths')}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-red-700 to-red-600 text-white rounded-t-lg">
              <CardTitle className="text-lg text-center">{t('testResults.developmentAreasTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {testResults.developmentAreas && testResults.developmentAreas.length > 0 ? (
                <div className="space-y-3">
                  {testResults.developmentAreas.map((area: any) => (
                    <div key={area.btn} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-800">{translateMotivationalFactor(area.btn)}</span>
                      <span className="text-red-600 font-bold">{Math.round(area.percent)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-600 py-8">
                  {t('testResults.noDevelopmentAreas')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">{t('testResults.getResults')}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleDownloadPDF}
                disabled={pdfStatus !== 'ready' || downloading}
                className="bg-blue-900 hover:bg-blue-800 text-white py-3"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('testResults.downloading')}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {t('testResults.download')}
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSendEmail}
                disabled={emailSent || pdfStatus !== 'ready'}
                variant={emailSent ? "outline" : "default"}
                className={emailSent ? "text-green-600 border-green-600" : "bg-rose-600 hover:bg-rose-700 text-white py-3"}
              >
                <Mail className="w-4 h-4 mr-2" />
                {emailSent ? t('testResults.sentToEmail') : t('testResults.sendToEmail')}
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{t('testResults.important')}</strong> {t('testResults.resultsAvailable')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestResults;