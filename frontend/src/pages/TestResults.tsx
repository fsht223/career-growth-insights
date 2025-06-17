// src/pages/TestResults.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, Mail, Star, Award, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ApiService from '@/services/api';

const TestResults = () => {
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

    // Get results from navigation state or fetch from API
    if (location.state?.results) {
      setTestResults(location.state.results);
      setPdfStatus(location.state.pdfStatus || 'generating');
      
      // Start polling for PDF status if generating
      if (location.state.pdfStatus === 'generating' && location.state.resultId) {
        pollPDFStatus(location.state.resultId);
      }
    }
  }, [location.state]);

  const pollPDFStatus = async (resultId: string) => {
    const checkStatus = async () => {
      try {
        const status = await ApiService.getReportStatus(resultId);
        
        setPdfStatus(status.pdfStatus);
        
        if (status.pdfStatus === 'ready') {
          setPdfUrl(status.pdfUrl);
          toast({
            title: "PDF готов!",
            description: "Ваш отчет готов к скачиванию",
          });
        } else if (status.pdfStatus === 'failed') {
          toast({
            title: "Ошибка генерации PDF",
            description: "Не удалось создать PDF отчет",
            variant: "destructive",
          });
        } else if (status.pdfStatus === 'generating') {
          // Continue polling
          setTimeout(checkStatus, 3000);
        }
      } catch (error) {
        console.error('Failed to check PDF status:', error);
        setTimeout(checkStatus, 5000); // Retry in 5 seconds on error
      }
    };

    checkStatus();
  };

  const handleDownloadPDF = async () => {
    if (!location.state?.resultId) {
      toast({
        title: "Ошибка",
        description: "ID отчета не найден",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloading(true);
      
      const blob = await ApiService.downloadPDF(location.state.resultId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Отчет_${userData?.lastName}_${userData?.firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Загрузка завершена",
        description: "PDF отчет успешно скачан",
      });
      
    } catch (error: any) {
      console.error('PDF download failed:', error);
      
      if (error.message.includes('still being generated')) {
        toast({
          title: "PDF еще создается",
          description: "Пожалуйста, подождите несколько секунд",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось скачать PDF отчет",
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
      title: "Отчет отправлен",
      description: `Отчет отправлен на email: ${userData?.email}`,
    });
  };

  // Mock results for display (replace with actual results from testResults)
  const mockResults = [
    { name: "Analytical Thinking", score: 85, benchmark: 75, group: "analytical" },
    { name: "Leadership", score: 92, benchmark: 80, group: "leadership" },
    { name: "Communication", score: 78, benchmark: 85, group: "communication" },
    { name: "Innovation", score: 95, benchmark: 70, group: "innovation" },
    { name: "Team Collaboration", score: 88, benchmark: 90, group: "teamwork" },
    { name: "Problem Solving", score: 82, benchmark: 75, group: "problem_solving" },
    { name: "Adaptability", score: 76, benchmark: 80, group: "adaptability" },
    { name: "Decision Making", score: 89, benchmark: 85, group: "decision_making" },
  ];

  const getScoreColor = (score: number, benchmark: number) => {
    const percentage = (score / benchmark) * 100;
    if (percentage < 90) return "text-red-600";
    if (percentage > 110) return "text-red-600"; 
    return "text-green-600";
  };

  const getProgressColor = (score: number, benchmark: number) => {
    const percentage = (score / benchmark) * 100;
    if (percentage < 90) return "bg-red-500";
    if (percentage > 110) return "bg-red-500";
    return "bg-green-500";
  };

  const getPDFStatusDisplay = () => {
    switch (pdfStatus) {
      case 'generating':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Генерация PDF...',
          color: 'text-blue-600'
        };
      case 'ready':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'PDF готов',
          color: 'text-green-600'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Ошибка создания PDF',
          color: 'text-red-600'
        };
      default:
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Обработка...',
          color: 'text-gray-600'
        };
    }
  };

  if (!userData || !testResults) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Обработка результатов...</p>
        </div>
      </div>
    );
  }

  const statusDisplay = getPDFStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Award className="w-8 h-8 text-yellow-600" />
              <h1 className="text-2xl font-bold text-slate-800">Результаты тестирования</h1>
            </div>
            <p className="text-slate-600">
              {userData.firstName} {userData.lastName} • {userData.profession}
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
                <h2 className="text-lg font-semibold text-green-800">Тестирование завершено!</h2>
                <p className="text-green-700">
                  Спасибо за участие. Ваш персональный отчет готов к просмотру.
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
                <h3 className="font-semibold text-blue-800">Статус PDF отчета</h3>
                <p className={`${statusDisplay.color} font-medium`}>
                  {statusDisplay.text}
                </p>
                {pdfStatus === 'generating' && (
                  <p className="text-blue-600 text-sm mt-1">
                    Это может занять 1-2 минуты. Страница автоматически обновится.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Chart */}
        <Card className="mb-8 shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="text-xl text-center">Профиль компетенций</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {mockResults.map((result, index) => {
                const percentage = (result.score / result.benchmark) * 100;
                const isStarred = Math.random() > 0.7; // Mock starred items
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-800">{result.name}</span>
                        {isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${getScoreColor(result.score, result.benchmark)}`}>
                          {Math.round(percentage)}%
                        </span>
                        <div className="text-xs text-slate-500">
                          {result.score}/{result.benchmark}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Progress 
                        value={Math.min(percentage, 120)} 
                        className="h-4 bg-slate-200"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-4 rounded-full transition-all ${getProgressColor(result.score, result.benchmark)}`}
                        style={{ width: `${Math.min(percentage, 120)}%` }}
                      />
                      
                      {/* Benchmark line */}
                      <div 
                        className="absolute top-0 h-4 w-0.5 bg-slate-800"
                        style={{ left: '100%' }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        {percentage < 90 ? 'Potential development area' : 
                         percentage > 110 ? 'Potential development area' : 
                         'Aligned with benchmark'}
                      </span>
                      <span>Benchmark: 100%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Легенда:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>Выбранные мотивационные факторы</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-green-500 rounded"></div>
                  <span>Соответствует эталону (90-110%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-red-500 rounded"></div>
                  <span>Область развития (&lt;90% или &gt;110%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Получить результаты</CardTitle>
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
                    Скачивание...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать PDF отчет
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
                {emailSent ? "Отправлено на email" : "Отправить на email"}
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Важно:</strong> Результаты будут доступны для скачивания в течение 30 дней. 
                Рекомендуем сохранить отчет или отправить его на email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestResults;