// src/pages/Login.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, FileText } from 'lucide-react';
import ApiService from '@/services/api';
import { useTranslation } from '@/hooks/useTranslation';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t('login.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('login.invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('login.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await ApiService.login(
        formData.email.trim().toLowerCase(),
        formData.password
      );
      
      toast({
        title: t('login.success'),
        description: t('login.welcome', { name: response.user.firstName }),
      });

      // Navigate to dashboard after successful login
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Login failed:', error);
      
      const errorMessage = error.message || t('login.error');
      
      if (errorMessage.includes('Invalid credentials')) {
        setErrors({ 
          email: t('login.invalid'),
          password: t('login.invalid')
        });
      } else {
        toast({
          title: t('login.error'),
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <FileText className="w-8 h-8" />
              <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
            </div>
            <p className="text-blue-100">{t('login.platform')}</p>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  {t('login.email')}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="coach@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`border-slate-300 focus:border-blue-500 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">
                  {t('login.password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`border-slate-300 focus:border-blue-500 pr-10 ${
                      errors.password ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 text-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('login.loading')}
                  </>
                ) : (
                  t('login.button')
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-600 hover:text-blue-800 text-sm"
                  disabled={isLoading}
                >
                  {t('login.forgot')}
                </Button>
              </div>

              {/* Register Link */}
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  {t('login.noAccount')} 
                  <Link 
                    to="/register" 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t('login.register')}
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-slate-100 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">{t('login.demo')}</h4>
          <div className="text-xs text-slate-600 space-y-1">
            <p><strong>{t('login.demoEmail')}</strong> {t('login.demoEmailValue')}</p>
            <p><strong>{t('login.demoPassword')}</strong> {t('login.demoPasswordValue')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;