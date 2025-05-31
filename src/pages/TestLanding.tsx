
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Users, Clock, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TestLanding = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
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
    'Другое'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.gdprAccepted) {
      toast({
        title: "Необходимо согласие",
        description: "Пожалуйста, примите условия обработки данных",
        variant: "destructive",
      });
      return;
    }

    // Save user data and redirect to test
    localStorage.setItem('testUserData', JSON.stringify(formData));
    navigate(`/test/${testId}/questions`);
  };

  const gdprText = `
    ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ И ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ

    1. ОБЩИЕ ПОЛОЖЕНИЯ
    Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей платформы тестирования.

    2. ЦЕЛИ ОБРАБОТКИ ДАННЫХ
    - Проведение психологического тестирования
    - Формирование персональных отчетов
    - Отправка результатов тестирования

    3. СОСТАВ ОБРАБАТЫВАЕМЫХ ДАННЫХ
    - Имя и фамилия
    - Адрес электронной почты
    - Профессиональная деятельность
    - Ответы на вопросы тестирования

    4. ПРАВА СУБЪЕКТОВ ДАННЫХ
    Вы имеете право на:
    - Доступ к своим персональным данным
    - Исправление неточных данных
    - Удаление персональных данных
    - Ограничение обработки

    5. БЕЗОПАСНОСТЬ ДАННЫХ
    Мы применяем технические и организационные меры для защиты ваших данных от несанкционированного доступа, изменения, раскрытия или уничтожения.

    6. СРОК ХРАНЕНИЯ
    Персональные данные хранятся не дольше, чем это необходимо для достижения целей обработки.

    Продолжая использование сервиса, вы соглашаетесь с данной Политикой конфиденциальности.
  `;

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
              <h1 className="text-xl font-bold text-slate-800">Платформа тестирования</h1>
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
            Результаты будут представлены в виде подробного отчета.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">15-20 минут</h3>
              <p className="text-sm text-slate-600">Время прохождения теста</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-rose-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">40 вопросов</h3>
              <p className="text-sm text-slate-600">Количество вопросов в тесте</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Shield className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">Конфиденциально</h3>
              <p className="text-sm text-slate-600">Ваши данные защищены</p>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        <Card className="max-w-2xl mx-auto shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="text-xl text-center">Регистрация для прохождения теста</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700">Имя *</Label>
                  <Input
                    id="firstName"
                    placeholder="Введите ваше имя"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="border-slate-300 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700">Фамилия *</Label>
                  <Input
                    id="lastName"
                    placeholder="Введите вашу фамилию"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="border-slate-300 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="border-slate-300 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession" className="text-slate-700">Профессия *</Label>
                <Select
                  value={formData.profession}
                  onValueChange={(value) => setFormData({...formData, profession: value})}
                  required
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

              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="gdpr"
                    checked={formData.gdprAccepted}
                    onCheckedChange={(checked) => setFormData({...formData, gdprAccepted: checked as boolean})}
                    className="mt-1"
                    required
                  />
                  <div className="flex-1 text-sm">
                    <Label htmlFor="gdpr" className="text-slate-700 cursor-pointer">
                      Я согласен(на) с обработкой персональных данных и{' '}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button type="button" className="text-blue-600 hover:text-blue-800 underline">
                            политикой конфиденциальности
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Политика конфиденциальности</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-96">
                            <div className="text-sm text-slate-700 whitespace-pre-line">
                              {gdprText}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      {' *'}
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-medium py-3 text-lg transition-all duration-200"
                disabled={!formData.gdprAccepted}
              >
                Начать тестирование
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestLanding;
