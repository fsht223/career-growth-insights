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

const TestLanding = () => {
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

  const professions = [
    'C Level',
    'Маркетинг',
    'Продажи',
    'HR',
    'IT',
    'Финансы',
    'Операции',
    'Консалтинг',
    'Образование',
    'Другое'
  ];

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
        title: "Ошибка",
        description: "Тест не найден или недоступен",
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
        title: "Необходимо согласие",
        description: "Пожалуйста, примите условия обработки данных",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await ApiService.registerForTest(testId!, formData);
      
      if (response.completed) {
        toast({
          title: "Тест уже пройден",
          description: "Вы уже завершили этот тест",
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
          title: "Тест завершен",
          description: "Вы уже прошли этот тест",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка регистрации",
          description: error.message || "Не удалось зарегистрироваться для прохождения теста",
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
    // This would typically require backend support to reset the session
    toast({
      title: "Обратитесь к администратору",
      description: "Для начала нового теста обратитесь к коучу, который предоставил ссылку",
      variant: "destructive",
    });
  };

  const gdprText = `
ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ И ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ

1. ОБЩИЕ ПОЛОЖЕНИЯ
Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей платформы тестирования профессиональных компетенций и мотивационных факторов.

2. ЦЕЛИ ОБРАБОТКИ ДАННЫХ
Мы обрабатываем ваши персональные данные исключительно для следующих целей:
- Проведение психологического и профессионального тестирования
- Формирование персональных отчетов и рекомендаций
- Отправка результатов тестирования на указанный email
- Обеспечение возможности продолжения теста после перерыва

3. СОСТАВ ОБРАБАТЫВАЕМЫХ ДАННЫХ
В рамках тестирования мы собираем и обрабатываем следующие данные:
- Имя и фамилия
- Адрес электронной почты
- Профессиональная деятельность/специализация
- Ответы на вопросы тестирования
- Временные метки прохождения теста
- Технические данные сессии (для восстановления прогресса)

4. ПРАВА СУБЪЕКТОВ ДАННЫХ
В соответствии с требованиями GDPR, вы имеете следующие права:
- Право на доступ к своим персональным данным
- Право на исправление неточных или неполных данных
- Право на удаление персональных данных ("право быть забытым")
- Право на ограничение обработки персональных данных
- Право на возражение против обработки данных
- Право на портируемость данных

5. ОСНОВАНИЯ ДЛЯ ОБРАБОТКИ
Обработка ваших персональных данных осуществляется на основании:
- Вашего добровольного согласия на обработку данных
- Необходимости исполнения договорных обязательств
- Законных интересов для проведения оценки компетенций

6. БЕЗОПАСНОСТЬ ДАННЫХ
Мы применяем современные технические и организационные меры для защиты ваших данных:
- Шифрование передаваемых данных (HTTPS)
- Ограничение доступа к данным (только уполномоченный персонал)
- Регулярное резервное копирование
- Мониторинг безопасности систем
- Обучение персонала вопросам защиты данных

7. ПЕРЕДАЧА ДАННЫХ ТРЕТЬИМ ЛИЦАМ
Ваши персональные данные не передаются третьим лицам, за исключением:
- Случаев, когда это необходимо для предоставления услуги (например, отправка отчета)
- Требований законодательства
- Получения вашего явного согласия

8. МЕЖДУНАРОДНАЯ ПЕРЕДАЧА ДАННЫХ
При международной передаче данных мы обеспечиваем адекватный уровень защиты в соответствии с требованиями GDPR.

9. СРОК ХРАНЕНИЯ ДАННЫХ
Персональные данные хранятся не дольше, чем это необходимо для достижения целей обработки:
- Результаты тестирования: 30 дней после завершения
- Технические данные сессии: удаляются после завершения теста
- Контактные данные: удаляются через 30 дней после отправки отчета

10. ФАЙЛЫ COOKIE И АНАЛИТИКА
Мы используем минимально необходимые технические cookies для обеспечения функционирования сайта и сохранения прогресса тестирования.

11. КОНТАКТНАЯ ИНФОРМАЦИЯ
По вопросам обработки персональных данных вы можете обратиться:
Email: privacy@testplatform.com
Время обработки запросов: до 30 дней

12. ИЗМЕНЕНИЯ В ПОЛИТИКЕ
Мы можем обновлять данную Политику конфиденциальности. Об изменениях мы уведомим вас заранее.

Дата последнего обновления: [текущая дата]

Продолжая использование сервиса, вы подтверждаете, что ознакомились с данной Политикой конфиденциальности и согласны с условиями обработки ваших персональных данных.
  `;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка теста...</p>
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
            <h2 className="text-xl font-bold text-slate-800 mb-2">Тест не найден</h2>
            <p className="text-slate-600 mb-4">
              Указанный тест недоступен или был удален. Проверьте правильность ссылки.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Вернуться на главную
            </Button>
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
                {testInfo.projectName || 'Платформа тестирования'}
              </h1>
              <p className="text-sm text-slate-600">Персональная оценка компетенций</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Добро пожаловать на тестирование!
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Этот тест поможет определить ваши профессиональные компетенции и мотивационные факторы. 
            Результаты будут представлены в виде подробного персонального отчета с рекомендациями по развитию.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">15-20 минут</h3>
              <p className="text-sm text-slate-600">Время прохождения</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-rose-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">40 вопросов</h3>
              <p className="text-sm text-slate-600">Глубокий анализ</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">GDPR</h3>
              <p className="text-sm text-slate-600">Защита данных</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <FileText className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">PDF отчет</h3>
              <p className="text-sm text-slate-600">Детальные результаты</p>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Сохранение прогресса</h3>
                <p className="text-blue-700 text-sm">
                  Ваш прогресс автоматически сохраняется каждые 30 секунд. Если вы случайно закроете 
                  браузер или прервете тестирование, вы сможете продолжить с того же места, 
                  вернувшись по этой ссылке.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="max-w-2xl mx-auto shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="text-xl text-center">
              Регистрация для прохождения теста
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700">
                    Имя *
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Введите ваше имя"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="border-slate-300 focus:border-blue-500"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700">
                    Фамилия *
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Введите вашу фамилию"
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
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="border-slate-300 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-slate-500">
                  На этот email будет отправлен отчет с результатами
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession" className="text-slate-700">
                  Профессия/Специализация *
                </Label>
                <Select
                  value={formData.profession}
                  onValueChange={(value) => setFormData({...formData, profession: value})}
                  required
                  disabled={submitting}
                >
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="Выберите вашу профессию" />
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
                    id="gdpr"
                    checked={formData.gdprAccepted}
                    onCheckedChange={(checked) => setFormData({...formData, gdprAccepted: checked as boolean})}
                    className="mt-1"
                    required
                    disabled={submitting}
                  />
                  <div className="flex-1 text-sm">
                    <Label htmlFor="gdpr" className="text-slate-700 cursor-pointer leading-relaxed">
                      Я ознакомился(ась) и согласен(на) с{' '}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button 
                            type="button" 
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                            disabled={submitting}
                          >
                            политикой конфиденциальности и обработки персональных данных
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Политика конфиденциальности и обработки персональных данных</DialogTitle>
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
                      Нажимая "Начать тестирование", вы даете согласие на обработку 
                      персональных данных в соответствии с GDPR.
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
                    Регистрация...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Начать тестирование
                  </>
                )}
              </Button>

              {/* Additional Info */}
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Время тестирования: 15-20 минут • Язык: {testInfo.language === 'ru' ? 'Русский' : testInfo.language === 'kz' ? 'Казахский' : 'English'}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Часто задаваемые вопросы</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Что делать, если тест прервался?</h4>
              <p className="text-sm text-slate-600">
                Не волнуйтесь! Ваш прогресс автоматически сохраняется. Просто вернитесь по той же ссылке 
                и введите тот же email - вы продолжите с того места, где остановились.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Можно ли пройти тест повторно?</h4>
              <p className="text-sm text-slate-600">
                Каждый email может пройти тест только один раз. Если вам нужно пройти тест повторно, 
                обратитесь к коучу, который предоставил ссылку.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Как я получу результаты?</h4>
              <p className="text-sm text-slate-600">
                После завершения теста вы сразу увидите результаты на экране и сможете скачать 
                PDF-отчет или отправить его на email.
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
              <span>Найден незавершенный тест</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Мы обнаружили, что вы уже начали проходить этот тест. 
              Хотите продолжить с вопроса {existingSession?.continueFrom + 1} или начать заново?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartNewTest}>
              Начать заново
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueTest}>
              <Play className="w-4 h-4 mr-2" />
              Продолжить тест
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestLanding;