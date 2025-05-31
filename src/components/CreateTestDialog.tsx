
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTestDialog = ({ open, onOpenChange }: CreateTestDialogProps) => {
  const [formData, setFormData] = useState({
    projectName: '',
    goldenLine: '',
    language: '',
    reseller: '',
    coachEmail: '',
    reportRecipient: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate unique test link
    const testId = Math.random().toString(36).substr(2, 9);
    const testLink = `${window.location.origin}/test/${testId}`;
    
    // Save test data to localStorage (in real app, this would be an API call)
    const existingTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const newTest = {
      id: testId,
      ...formData,
      link: testLink,
      status: 'Отправлено',
      createdAt: new Date().toISOString()
    };
    
    existingTests.push(newTest);
    localStorage.setItem('tests', JSON.stringify(existingTests));
    
    toast({
      title: "Тест создан!",
      description: `Ссылка на тест: ${testLink}`,
    });
    
    onOpenChange(false);
    
    // Reset form
    setFormData({
      projectName: '',
      goldenLine: '',
      language: '',
      reseller: '',
      coachEmail: '',
      reportRecipient: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Создание нового теста
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Название проекта</Label>
              <Input
                id="projectName"
                placeholder="Введите название проекта"
                value={formData.projectName}
                onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                required
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goldenLine">Golden Line</Label>
              <Select
                value={formData.goldenLine}
                onValueChange={(value) => setFormData({...formData, goldenLine: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите профессию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c-level">C Level</SelectItem>
                  <SelectItem value="marketing">Маркетинг</SelectItem>
                  <SelectItem value="sales">Продажи</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Язык теста</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({...formData, language: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="kz">Казахский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reseller">Реселлер</Label>
              <Input
                id="reseller"
                placeholder="Название реселлера"
                value={formData.reseller}
                onChange={(e) => setFormData({...formData, reseller: e.target.value})}
                maxLength={30}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coachEmail">Email коуча</Label>
              <Input
                id="coachEmail"
                type="email"
                placeholder="coach@example.com"
                value={formData.coachEmail}
                onChange={(e) => setFormData({...formData, coachEmail: e.target.value})}
                required
                maxLength={30}
              />
            </div>
          </div>
          
          <Card className="border-2 border-slate-200">
            <CardContent className="p-4">
              <Label className="text-base font-medium text-slate-800 mb-3 block">
                Получатель отчета
              </Label>
              <RadioGroup
                value={formData.reportRecipient}
                onValueChange={(value) => setFormData({...formData, reportRecipient: value})}
                className="space-y-3"
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coach" id="coach" />
                  <Label htmlFor="coach" className="text-slate-700">
                    Коуч
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="testee" id="testee" />
                  <Label htmlFor="testee" className="text-slate-700">
                    Тестируемый (автоматически после завершения)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              Создать тест
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTestDialog;
