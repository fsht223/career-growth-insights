// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Settings, LogOut, Link2, Trash2, Eye, Copy, RefreshCw, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import ApiService from '@/services/api';
import CreateTestDialog from '@/components/CreateTestDialog';
import { useTranslation } from '@/hooks/useTranslation';

interface Test {
  id: string;
  projectName: string;
  goldenLine: string;
  language: string;
  reseller: string;
  coachEmail: string;
  testeeEmail?: string;
  testCount: number;
  reportRecipient: string;
  link: string;
  status: string;
  createdAt: string;
  registeredEmails: string[];
}

interface Report {
  id: string;
  testId: string;
  testeeEmail: string;
  testeeName: string;
  profession: string;
  completedAt: string;
  reportUrl: string;
}

const Dashboard = () => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState('tests');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const currentUser = ApiService.getCurrentUser();

  useEffect(() => {
    if (!ApiService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [testsData, reportsData] = await Promise.all([
        ApiService.getTests(),
        ApiService.getReports()
      ]);
      
      setTests(testsData);
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: t('dashboard.errorLoading') || 'Ошибка загрузки',
        description: t('dashboard.errorLoadingDesc') || 'Не удалось загрузить данные панели',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: t('dashboard.refresh'),
      description: t('dashboard.dataUpdated') || 'Информация успешно обновлена',
    });
  };

  const handleLogout = () => {
    ApiService.logout();
    toast({
      title: t('dashboard.logout'),
      description: t('dashboard.goodbye') || 'До свидания!',
    });
    navigate('/login');
  };

  const copyTestLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: t('dashboard.copyLink'),
      description: t('dashboard.linkCopied') || 'Ссылка на тест скопирована в буфер обмена',
    });
  };

  const deleteTest = async (testId: string) => {
    try {
      await ApiService.deleteTest(testId);
      setTests(prev => prev.filter(test => test.id !== testId));
      toast({
        title: t('dashboard.delete'),
        description: t('dashboard.testDeleted') || 'Тест успешно удален из системы',
      });
    } catch (error) {
      toast({
        title: t('dashboard.deleteError') || 'Ошибка удаления',
        description: t('dashboard.deleteErrorDesc') || 'Не удалось удалить тест',
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (test: Test) => {
    const completedCount = (reports || []).filter(r => r.testId === test.id).length;
    const registeredCount = (test.registeredEmails || []).length;
    
    if (completedCount > 0) {
      return (
        <Badge className="bg-green-100 text-green-800">
          {t('dashboard.status.completed', { count: completedCount })}
        </Badge>
      );
    } else if (registeredCount > 0) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          {t('dashboard.status.inProgress', { count: registeredCount })}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-slate-100 text-slate-800">
          {t('dashboard.status.created')}
        </Badge>
      );
    }
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      'ru': t('dashboard.language.ru'),
      'kz': 'Казахский', 
      'en': t('dashboard.language.en')
    };
    return languages[code] || code;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add safe defaults for tests and reports
  const safeTests = tests || [];
  const safeReports = reports || [];

  const statsData = {
    totalTests: safeTests.length,
    completedTests: safeReports.length,
    activeTests: safeTests.filter(t => (t.registeredEmails || []).length > 0 && !safeReports.some(r => r.testId === t.id)).length,
    totalParticipants: new Set(safeReports.map(r => r.testeeEmail)).size
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('dashboard.loading') || 'Загрузка панели...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{t('dashboard.title')}</h1>
                <p className="text-sm text-slate-600">
                  {t('dashboard.welcome', { name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}` })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {t('dashboard.refresh')}
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-slate-600 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('dashboard.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">{t('dashboard.stats.totalTests')}</p>
                  <p className="text-2xl font-semibold text-slate-900">{statsData.totalTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">{t('dashboard.stats.completedTests')}</p>
                  <p className="text-2xl font-semibold text-slate-900">{statsData.completedTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">{t('dashboard.stats.activeTests')}</p>
                  <p className="text-2xl font-semibold text-slate-900">{statsData.activeTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">{t('dashboard.stats.participants')}</p>
                  <p className="text-2xl font-semibold text-slate-900">{statsData.totalParticipants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
            <TabsTrigger 
              value="tests" 
              className="data-[state=active]:bg-blue-900 data-[state=active]:text-white"
            >
              Тесты
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-blue-900 data-[state=active]:text-white"
            >
              Отчеты
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-blue-900 data-[state=active]:text-white"
            >
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Управление тестами</h2>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-900 hover:bg-blue-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать тест
              </Button>
            </div>

            {tests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <Link2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Нет созданных тестов</h3>
                    <p className="text-slate-600">Создайте первый тест для начала работы</p>
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-blue-900 hover:bg-blue-800 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Создать тест
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tests.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-slate-800">{test.projectName}</CardTitle>
                          <p className="text-sm text-slate-600 mt-1">
                            Создан: {formatDate(test.createdAt)}
                          </p>
                        </div>
                        {getStatusBadge(test)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">Профессия:</span>
                          <p className="text-slate-600">{test.goldenLine}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Язык:</span>
                          <p className="text-slate-600">{getLanguageName(test.language)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Реселлер:</span>
                          <p className="text-slate-600">{test.reseller || 'Не указан'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Получатель:</span>
                          <p className="text-slate-600">
                            {test.reportRecipient === 'coach' ? 'Коуч' : 'Тестируемый'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-700 text-sm">Ссылка на тест:</span>
                            <p className="text-slate-600 text-sm truncate mt-1">{test.link}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyTestLink(test.link)}
                            className="ml-3 flex-shrink-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <div className="text-sm text-slate-600">
                          <span>Зарегистрировано: {(test.registeredEmails || []).length}</span>
                          {test.testeeEmail && (
                            <span className="ml-4">Email: {test.testeeEmail}</span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Просмотр
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteTest(test.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Отчеты тестирований</h2>
            
            {reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Нет завершенных тестов</h3>
                    <p className="text-slate-600">Отчеты появятся после прохождения тестов</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => {
                  const relatedTest = tests.find(t => t.id === report.testId);
                  return (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-slate-800">
                              {relatedTest?.projectName || 'Неизвестный тест'}
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                              Завершен: {formatDate(report.completedAt)}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Завершен
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Участник:</span>
                            <p className="text-slate-600">{report.testeeName}</p>
                            <p className="text-slate-500 text-xs">{report.testeeEmail}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Профессия:</span>
                            <p className="text-slate-600">{report.profession}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Язык теста:</span>
                            <p className="text-slate-600">{getLanguageName(relatedTest?.language || 'ru')}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => window.open(report.reportUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Просмотр отчета
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:text-green-700"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Скачать PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Настройки системы</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Профиль пользователя
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Имя:</p>
                      <p className="text-slate-600">{currentUser?.firstName} {currentUser?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Email:</p>
                      <p className="text-slate-600">{currentUser?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Роль:</p>
                      <p className="text-slate-600">Коуч</p>
                    </div>
                  </div>
                  <Button className="mt-4 w-full" variant="outline">
                    Редактировать профиль
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Управление вопросами</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Настройка категорий вопросов и мотивационных групп
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">• 18 мотивационных кнопок</p>
                    <p className="text-sm text-slate-500">• 40 вопросов в тесте</p>
                    <p className="text-sm text-slate-500">• Контрольные вопросы</p>
                  </div>
                  <Button className="mt-4 w-full" variant="outline">
                    Настроить вопросы
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Golden Line</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Эталонные значения для различных профессий
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">• C Level</p>
                    <p className="text-sm text-slate-500">• Маркетинг</p>
                    <p className="text-sm text-slate-500">• Продажи</p>
                    <p className="text-sm text-slate-500">• HR, IT, Финансы</p>
                  </div>
                  <Button className="mt-4 w-full" variant="outline">
                    Настроить эталоны
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Шаблоны отчетов</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Настройка текстов и рекомендаций в отчетах
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">• Сильные стороны</p>
                    <p className="text-sm text-slate-500">• Области развития</p>
                    <p className="text-sm text-slate-500">• Рекомендации</p>
                  </div>
                  <Button className="mt-4 w-full" variant="outline">
                    Редактировать шаблоны
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Языковые настройки</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Управление переводами и локализацией
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">• Русский язык</p>
                    <p className="text-sm text-slate-500">• Казахский язык</p>
                    <p className="text-sm text-slate-500">• English</p>
                  </div>
                  <Button className="mt-4 w-full" variant="outline">
                    Управление переводами
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Экспорт данных</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Экспорт результатов и статистики
                  </p>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full">
                      Экспорт всех тестов
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      Экспорт отчетов
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      Статистика
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Информация о системе</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Версия системы</h4>
                    <p className="text-slate-600">v1.0.0</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Последнее обновление</h4>
                    <p className="text-slate-600">{formatDate(new Date().toISOString())}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Поддержка</h4>
                    <p className="text-slate-600">support@testplatform.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateTestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTestCreated={loadDashboardData}
      />
    </div>
  );
};

export default Dashboard;