
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Shield, Award, Clock, CheckCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Платформа тестирования</h1>
                <p className="text-xs text-slate-600">Профессиональная оценка компетенций</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              Вход для коучей
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-slate-800 mb-6">
            Профессиональное <span className="text-blue-900">тестирование</span><br />
            компетенций и мотивации
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
            Современная платформа для глубокой оценки профессиональных навыков, 
            мотивационных факторов и потенциала развития сотрудников
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white px-8 py-4 text-lg"
            >
              Начать работу с коучем
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-blue-900 text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg"
            >
              Узнать больше
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-slate-800 mb-12">
            Преимущества платформы
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-800 mb-4">
                  Комплексная оценка
                </h4>
                <p className="text-slate-600">
                  40 вопросов для глубокого анализа профессиональных компетенций и мотивационных факторов
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-rose-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-800 mb-4">
                  Быстро и удобно
                </h4>
                <p className="text-slate-600">
                  Прохождение теста занимает всего 15-20 минут с интуитивно понятным интерфейсом
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-yellow-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-800 mb-4">
                  Детальные отчеты
                </h4>
                <p className="text-slate-600">
                  Персональные отчеты с визуализацией результатов и рекомендациями по развитию
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-800 mb-4">
                  GDPR соответствие
                </h4>
                <p className="text-slate-600">
                  Полное соответствие требованиям защиты персональных данных и конфиденциальности
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-800 mb-4">
                  Управление тестами
                </h4>
                <p className="text-slate-600">
                  Удобная панель для коучей с возможностью создания, управления и мониторинга тестов
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-indigo-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-800 mb-4">
                  Безопасность данных
                </h4>
                <p className="text-slate-600">
                  Современные методы шифрования и защиты для обеспечения безопасности ваших данных
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h3 className="text-3xl font-bold mb-6">
            Готовы начать профессиональную оценку?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Присоединяйтесь к платформе и откройте новые возможности для развития
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="bg-white text-blue-900 hover:bg-slate-100 px-8 py-4 text-lg font-semibold"
          >
            Начать работу
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Платформа тестирования</span>
            </div>
            <div className="text-sm">
              © 2024 Все права защищены
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
