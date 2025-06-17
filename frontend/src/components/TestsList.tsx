
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Trash2, Eye, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Test {
  id: string;
  projectName: string;
  goldenLine: string;
  language: string;
  reseller: string;
  coachEmail: string;
  reportRecipient: string;
  link: string;
  status: string;
  createdAt: string;
}

const TestsList = () => {
  const [tests, setTests] = useState<Test[]>([]);

  useEffect(() => {
    const savedTests = JSON.parse(localStorage.getItem('tests') || '[]');
    setTests(savedTests);
  }, []);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Ссылка скопирована!",
      description: "Ссылка на тест скопирована в буфер обмена",
    });
  };

  const deleteTest = (id: string) => {
    const updatedTests = tests.filter(test => test.id !== id);
    setTests(updatedTests);
    localStorage.setItem('tests', JSON.stringify(updatedTests));
    toast({
      title: "Тест удален",
      description: "Тест успешно удален из системы",
    });
  };

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Link2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Нет созданных тестов</h3>
            <p className="text-slate-600">Создайте первый тест для начала работы</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => (
        <Card key={test.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-slate-800">{test.projectName}</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Создан: {new Date(test.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <Badge 
                variant={test.status === 'Сдан' ? 'default' : 'secondary'}
                className={test.status === 'Сдан' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
              >
                {test.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">Профессия:</span>
                <p className="text-slate-600">{test.goldenLine}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Язык:</span>
                <p className="text-slate-600">{test.language}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Реселлер:</span>
                <p className="text-slate-600">{test.reseller || 'Не указан'}</p>
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
                  onClick={() => copyLink(test.link)}
                  className="ml-3 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-slate-600">
                Получатель отчета: <span className="font-medium">{test.reportRecipient === 'coach' ? 'Коуч' : 'Тестируемый'}</span>
              </p>
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
  );
};

export default TestsList;
