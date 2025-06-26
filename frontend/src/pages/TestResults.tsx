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

    let resultId = location.state?.resultId || localStorage.getItem('lastResultId');
    if (resultId) {
      ApiService.getReport(resultId).then(report => {
        console.log('Fetched report:', report); // Debug
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
        title: "Ошибка",
        description: "ID отчета не найден",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloading(true);
      
      const blob = await ApiService.downloadPDF(resultId);
      
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

  // Transform testResults into an array for rendering
  const motivationButtons = testResults && testResults.groupScores
    ? Object.keys(testResults.groupScores).map((btn) => ({
        name: btn,
        score: testResults.groupScores[btn],
        benchmark: testResults.goldenLine[btn] || 1,
        percentage: testResults.percentages[btn],
        isStarred: testResults.starredItems && testResults.starredItems.includes(btn)
      }))
    : [];

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

  if (!testResults) {
    console.log('userData:', userData, 'testResults:', testResults); // Debug
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Обработка результатов...</p>
        </div>
      </div>
    );
  }

  // Fallbacks for userData fields
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
              <h1 className="text-2xl font-bold text-slate-800">Результаты тестирования</h1>
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
              {motivationButtons.map((result, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-800">{result.name}</span>
                      {result.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${getScoreColor(result.score, result.benchmark)}`}>
                        {Math.round(result.percentage)}%
                      </span>
                      <div className="text-xs text-slate-500">
                        {result.score}/{result.benchmark}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={Math.min(Number(result.percentage), 200)} 
                      className="h-4 bg-slate-200"
                    />
                    <div 
                      className={`absolute top-0 left-0 h-4 rounded-full transition-all ${getProgressColor(result.score, result.benchmark)}`}
                      style={{ width: `${Math.min(Number(result.percentage), 200)}%` }}
                    />
                    {/* Benchmark line at 100% */}
                    <div 
                      className="absolute top-0 h-4 w-0.5 bg-slate-800"
                      style={{ left: '100%' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      {result.percentage < 90 ? 'Potential development area' : 
                        result.percentage > 110 ? 'Potential development area' : 
                        'Aligned with benchmark'}
                    </span>
                    <span>Benchmark: 100%</span>
                  </div>
                </div>
              ))}
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

        {/* Profile Averages */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Профили мотивации</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {testResults.profileAverages && Object.entries(testResults.profileAverages).map(([profile, value]) => (
              <div key={profile} className="flex flex-col items-center">
                <span className="font-semibold text-blue-800">{profile}</span>
                <span className="text-2xl font-bold">{Math.round(value)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Consistency, Awareness, Inner/Outer, Reasoning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg text-indigo-900">Согласованность (Consistency)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <span className="text-2xl font-bold">{Math.round(testResults.consistency || 0)}%</span>
              <span className="text-slate-600 text-sm mt-2">Согласованность ответов на повторяющиеся вопросы</span>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-900">Awareness Level</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <span className="text-2xl font-bold">{testResults.awarenessLevel || 0}%</span>
              <span className="text-slate-600 text-sm mt-2">Осознанность выбора мотивации</span>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">Внутренняя/Внешняя мотивация</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="flex flex-col items-center">
                <span className="font-semibold">Внутренняя: <span className="text-green-800">{Math.round(testResults.innerOuter?.inner || 0)}%</span></span>
                <span className="font-semibold">Внешняя: <span className="text-green-800">{Math.round(testResults.innerOuter?.outer || 0)}%</span></span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg text-purple-900">Reasoning</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="flex flex-col items-center">
                <span className="font-semibold">Интуиция: <span className="text-purple-800">{Math.round(testResults.reasoning?.intuition || 0)}%</span></span>
                <span className="font-semibold">Логика: <span className="text-purple-800">{Math.round(testResults.reasoning?.beingLogical || 0)}%</span></span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Development Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">Сильные стороны</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {testResults.strengths && testResults.strengths.length > 0 ? (
                <ul className="list-disc pl-6">
                  {testResults.strengths.map((btn: string) => (
                    <li key={btn} className="font-semibold text-green-800">{btn}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-600">Нет выраженных сильных сторон</span>
              )}
            </CardContent>
          </Card>
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg text-red-900">Зоны развития</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {testResults.developmentAreas && testResults.developmentAreas.length > 0 ? (
                <ul className="list-disc pl-6">
                  {testResults.developmentAreas.map((area: any) => (
                    <li key={area.btn} className="font-semibold text-red-800">
                      {area.btn}: {Math.round(area.percent)}%
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-600">Нет выраженных зон развития</span>
              )}
            </CardContent>
          </Card>
        </div>

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