
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Settings, LogOut, Link2, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import CreateTestDialog from '@/components/CreateTestDialog';
import TestsList from '@/components/TestsList';
import ReportsList from '@/components/ReportsList';

const Dashboard = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    toast({
      title: "Выход выполнен",
      description: "До свидания!",
    });
    navigate('/login');
  };

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
              <h1 className="text-xl font-bold text-slate-800">Панель коуча</h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-slate-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="tests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
            <TabsTrigger value="tests" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              Тесты
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
              Отчеты
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
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
            <TestsList />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Отчеты тестирований</h2>
            <ReportsList />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Настройки тестов</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Группы вопросов</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Управление категориями и группами вопросов</p>
                  <Button className="mt-4 w-full" variant="outline">
                    Настроить
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Golden Line</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Настройка эталонных значений по профессиям</p>
                  <Button className="mt-4 w-full" variant="outline">
                    Настроить
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Рекомендации</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Настройка текстов рекомендаций</p>
                  <Button className="mt-4 w-full" variant="outline">
                    Настроить
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateTestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
