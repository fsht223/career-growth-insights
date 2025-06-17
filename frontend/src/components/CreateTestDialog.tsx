// src/components/CreateTestDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import ApiService from '@/services/api';

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestCreated: () => void;
}

const CreateTestDialog = ({ open, onOpenChange, onTestCreated }: CreateTestDialogProps) => {
  const [formData, setFormData] = useState({
    projectName: '',
    goldenLine: '',
    language: 'ru',
    reseller: '',
    coachEmail: '',
    testeeEmail: '',
    testCount: 1,
    reportRecipient: 'coach',
    multipleEmails: false,
    emailList: '',
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentUser = ApiService.getCurrentUser();

  const goldenLineOptions = [
    'C Level',
    'Маркетинг', 
    'Продажи',
    'HR',
    'IT',
    'Финансы',
    'Операции',
    'Консалтинг',
    'Образование'
  ];

  const languageOptions = [
    { value: 'ru', label: 'Русский' },
    { value: 'kz', label: 'Казахский' },
    { value: 'en', label: 'English' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Название проекта обязательно';
    }

    if (!formData.goldenLine) {
      newErrors.goldenLine = 'Выберите профессию';
    }

    if (!formData.coachEmail.trim()) {
      newErrors.coachEmail = 'Email коуча обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.coachEmail)) {
      newErrors.coachEmail = 'Неверный формат email';
    }

    if (formData.multipleEmails) {
      if (!formData.emailList.trim()) {
        newErrors.emailList = 'Укажите email адреса тестируемых';
      } else {
        const emails = formData.emailList.split('\n').filter(email => email.trim());
        const invalidEmails = emails.filter(email => !/\S+@\S+\.\S+/.test(email.trim()));
        if (invalidEmails.length > 0) {
          newErrors.emailList = `Неверный формат email: ${invalidEmails.join(', ')}`;
        }
      }
    } else if (formData.testeeEmail && !/\S+@\S+\.\S+/.test(formData.testeeEmail)) {
      newErrors.testeeEmail = 'Неверный формат email';
    }

    if (formData.testCount < 1 || formData.testCount > 100) {
      newErrors.testCount = 'Количество тестов должно быть от 1 до 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const testData = {
        projectName: formData.projectName.trim(),
        goldenLine: formData.goldenLine,
        language: formData.language,
        reseller: formData.reseller.trim(),
        coachEmail: formData.coachEmail.trim(),
        testeeEmail: formData.multipleEmails ? undefined : formData.testeeEmail.trim(),
        testCount: formData.multipleEmails ? 
          formData.emailList.split('\n').filter(email => email.trim()).length : 
          formData.testCount,
        reportRecipient: formData.reportRecipient,
        description: formData.description.trim(),
        emailList: formData.multipleEmails ? 
          formData.emailList.split('\n').filter(email => email.trim()) : 
          undefined
      };

      const response = await ApiService.createTest(testData);
      
      toast({
        title: "Тест создан успешно!",
        description: `Ссылка на тест: ${response.link}`,
      });

      onTestCreated();
      onOpenChange(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Failed to create test:', error);
      toast({
        title: "Ошибка создания теста",
        description: error.message || "Не удалось создать тест",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      projectName: '',
      goldenLine: '',
      language: 'ru',
      reseller: '',
      coachEmail: currentUser?.email || '',
      testeeEmail: '',
      testCount: 1,
      reportRecipient: 'coach',
      multipleEmails: false,
      emailList: '',
      description: ''
    });
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  // Set default coach email when dialog opens
  React.useEffect(() => {
    if (open && currentUser?.email && !formData.coachEmail) {
      setFormData(prev => ({ ...prev, coachEmail: currentUser.email }));
    }
  }, [open, currentUser?.email]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Создание нового теста
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Основная информация</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Название проекта *</Label>
                  <Input
                    id="projectName"
                    placeholder="Введите название проекта"
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    maxLength={50}
                    className={errors.projectName ? 'border-red-500' : ''}
                  />
                  {errors.projectName && (
                    <p className="text-sm text-red-600">{errors.projectName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="goldenLine">Профессия (Golden Line) *</Label>
                  <Select
                    value={formData.goldenLine}
                    onValueChange={(value) => setFormData({...formData, goldenLine: value})}
                  >
                    <SelectTrigger className={errors.goldenLine ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Выберите профессию" />
                    </SelectTrigger>
                    <SelectContent>
                      {goldenLineOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.goldenLine && (
                    <p className="text-sm text-red-600">{errors.goldenLine}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Язык теста *</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({...formData, language: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите язык" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reseller">Реселлер</Label>
                  <Input
                    id="reseller"
                    placeholder="Название реселлера (необязательно)"
                    value={formData.reseller}
                    onChange={(e) => setFormData({...formData, reseller: e.target.value})}
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="description">Описание теста</Label>
                <Textarea
                  id="description"
                  placeholder="Краткое описание цели тестирования (необязательно)"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  maxLength={500}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Контактная информация</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coachEmail">Email коуча *</Label>
                  <Input
                    id="coachEmail"
                    type="email"
                    placeholder="coach@example.com"
                    value={formData.coachEmail}
                    onChange={(e) => setFormData({...formData, coachEmail: e.target.value})}
                    maxLength={50}
                    className={errors.coachEmail ? 'border-red-500' : ''}
                  />
                  {errors.coachEmail && (
                    <p className="text-sm text-red-600">{errors.coachEmail}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="multipleEmails"
                    checked={formData.multipleEmails}
                    onCheckedChange={(checked) => setFormData({...formData, multipleEmails: checked})}
                  />
                  <Label htmlFor="multipleEmails">Создать тест для нескольких участников</Label>
                </div>

                {formData.multipleEmails ? (
                  <div className="space-y-2">
                    <Label htmlFor="emailList">Email адреса тестируемых *</Label>
                    <Textarea
                      id="emailList"
                      placeholder="Введите email адреса, каждый с новой строки&#10;example1@company.com&#10;example2@company.com&#10;example3@company.com"
                      value={formData.emailList}
                      onChange={(e) => setFormData({...formData, emailList: e.target.value})}
                      rows={6}
                      className={errors.emailList ? 'border-red-500' : ''}
                    />
                    {errors.emailList && (
                      <p className="text-sm text-red-600">{errors.emailList}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Каждый участник получит индивидуальную ссылку на тест
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testeeEmail">Email тестируемого</Label>
                      <Input
                        id="testeeEmail"
                        type="email"
                        placeholder="testee@example.com (необязательно)"
                        value={formData.testeeEmail}
                        onChange={(e) => setFormData({...formData, testeeEmail: e.target.value})}
                        maxLength={50}
                        className={errors.testeeEmail ? 'border-red-500' : ''}
                      />
                      {errors.testeeEmail && (
                        <p className="text-sm text-red-600">{errors.testeeEmail}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Если указан, только этот email сможет пройти тест
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="testCount">Количество тестирований</Label>
                      <Input
                        id="testCount"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.testCount}
                        onChange={(e) => setFormData({...formData, testCount: parseInt(e.target.value) || 1})}
                        className={errors.testCount ? 'border-red-500' : ''}
                      />
                      {errors.testCount && (
                        <p className="text-sm text-red-600">{errors.testCount}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Report Settings */}
          <Card className="border-2 border-slate-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Настройки отчета</h3>
              
              <RadioGroup
                value={formData.reportRecipient}
                onValueChange={(value) => setFormData({...formData, reportRecipient: value})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coach" id="coach" />
                  <Label htmlFor="coach" className="text-slate-700">
                    <div>
                      <div className="font-medium">Коуч получает отчет</div>
                      <div className="text-sm text-slate-500">
                        Отчет будет доступен только в панели коуча
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="testee" id="testee" />
                  <Label htmlFor="testee" className="text-slate-700">
                    <div>
                      <div className="font-medium">Тестируемый получает отчет автоматически</div>
                      <div className="text-sm text-slate-500">
                        Отчет отправляется на email сразу после завершения теста
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="text-slate-700">
                    <div>
                      <div className="font-medium">И коуч, и тестируемый</div>
                      <div className="text-sm text-slate-500">
                        Отчет доступен коучу и отправляется тестируемому
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="bg-blue-900 hover:bg-blue-800 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание...
                </>
              ) : (
                'Создать тест'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTestDialog;