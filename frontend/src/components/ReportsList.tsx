
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Mail, Trash2 } from 'lucide-react';

interface Report {
  id: string;
  projectName: string;
  testeeEmail: string;
  completedAt: string;
  goldenLine: string;
  language: string;
}

const ReportsList = () => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // In a real app, this would fetch reports from an API
    const mockReports: Report[] = [
      {
        id: '1',
        projectName: 'Тестирование менеджеров',
        testeeEmail: 'manager@company.com',
        completedAt: '2024-01-15T10:30:00Z',
        goldenLine: 'C Level',
        language: 'ru'
      },
      {
        id: '2',
        projectName: 'HR оценка',
        testeeEmail: 'hr@company.com',
        completedAt: '2024-01-14T14:20:00Z',
        goldenLine: 'HR',
        language: 'ru'
      }
    ];
    setReports(mockReports);
  }, []);

  const deleteReport = (id: string) => {
    setReports(reports.filter(report => report.id !== id));
  };

  if (reports.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-slate-800">{report.projectName}</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Завершен: {new Date(report.completedAt).toLocaleDateString('ru-RU')} в {new Date(report.completedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
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
                <span className="font-medium text-slate-700">Email тестируемого:</span>
                <p className="text-slate-600">{report.testeeEmail}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Профессия:</span>
                <p className="text-slate-600">{report.goldenLine}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Язык:</span>
                <p className="text-slate-600">{report.language}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700">
                <Download className="w-4 h-4 mr-1" />
                Скачать PDF
              </Button>
              <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700">
                <Mail className="w-4 h-4 mr-1" />
                Отправить
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => deleteReport(report.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReportsList;
