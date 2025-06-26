// src/pages/Register.tsx
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
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('register.firstNameRequired');
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = t('register.firstNameRequired');
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('register.lastNameRequired');
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = t('register.lastNameRequired');
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('register.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('login.invalidEmail');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('register.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('register.passwordRequired');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('register.passwordRequired');
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.passwordMismatch');
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
      
      const registerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const response = await ApiService.register(registerData);
      
      toast({
        title: t('register.success'),
        description: t('register.welcome', { name: response.user.firstName }),
      });

      // Navigate to dashboard after successful registration
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      const errorMessage = error.message || t('register.error');
      
      if (errorMessage.includes('Email already registered')) {
        setErrors({ email: t('register.already') });
      } else {
        toast({
          title: t('register.error'),
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
              <CardTitle className="text-2xl font-bold">{t('register.title')}</CardTitle>
            </div>
            <p className="text-blue-100">{t('register.platform')}</p>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700">
                  {t('register.firstName')}
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder={t('register.firstName')}
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`border-slate-300 focus:border-blue-500 ${
                    errors.firstName ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700">
                  {t('register.lastName')}
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder={t('register.lastName')}
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`border-slate-300 focus:border-blue-500 ${
                    errors.lastName ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  {t('register.email')}
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
                  {t('register.password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('register.password')}
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700">
                  {t('register.confirmPassword')}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t('register.confirmPassword')}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`border-slate-300 focus:border-blue-500 pr-10 ${
                      errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
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
                    {t('register.loading')}
                  </>
                ) : (
                  t('register.button')
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  {t('register.haveAccount')} 
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t('register.login')}
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;