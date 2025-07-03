// frontend/src/pages/CoachActivation.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface CoachData {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
}

interface FormData {
    password: string;
    confirmPassword: string;
}

interface PasswordStrength {
    strength: number;
    text: string;
    color: string;
}

const CoachActivation: React.FC = () => {
    const [activationToken, setActivationToken] = useState<string>('');
    const [step, setStep] = useState<'loading' | 'activate' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [coachData, setCoachData] = useState<CoachData | null>(null);
    const [formData, setFormData] = useState<FormData>({
        password: '',
        confirmPassword: ''
    });

    // Get token from URL params
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || window.location.pathname.split('/').pop();

        if (token && token !== 'activate') {
            setActivationToken(token);
            verifyToken(token);
        } else {
            setStep('error');
            setError('Токен активации не найден');
        }
    }, []);

    const verifyToken = async (token: string): Promise<void> => {
        try {
            setIsLoading(true);

            const response = await fetch(`/api/auth/verify-activation/${token}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setCoachData(data.coach);
                setStep('activate');
            } else {
                setStep('error');
                setError(data.error || 'Недействительный токен активации');
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            setStep('error');
            setError('Ошибка при проверке токена');
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivation = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (formData.password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const response = await fetch('/api/auth/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: activationToken,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep('success');
                // Auto-redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                setError(data.error || 'Ошибка активации аккаунта');
            }
        } catch (error) {
            console.error('Error activating account:', error);
            setError('Ошибка при активации аккаунта');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getPasswordStrength = (password: string): PasswordStrength => {
        if (!password) return { strength: 0, text: '', color: 'bg-gray-200' };

        let strength = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        strength = Object.values(checks).filter(Boolean).length;

        const levels: Record<number, { text: string; color: string }> = {
            0: { text: 'Очень слабый', color: 'bg-red-500' },
            1: { text: 'Слабый', color: 'bg-red-400' },
            2: { text: 'Средний', color: 'bg-yellow-400' },
            3: { text: 'Хороший', color: 'bg-blue-400' },
            4: { text: 'Сильный', color: 'bg-green-400' },
            5: { text: 'Очень сильный', color: 'bg-green-500' }
        };

        return { strength, ...levels[strength] };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    if (step === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <span className="text-lg">Проверка токена...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            <XCircle className="h-12 w-12 text-red-500" />
                        </div>
                        <CardTitle className="text-2xl text-red-600">Ошибка активации</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Alert className="mb-4">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <div className="text-center">
                            <p className="text-gray-600 mb-4">
                                Возможные причины:
                            </p>
                            <ul className="text-sm text-gray-600 text-left space-y-1">
                                <li>• Токен активации истек</li>
                                <li>• Аккаунт уже активирован</li>
                                <li>• Неверная ссылка активации</li>
                            </ul>
                            <Button
                                className="mt-6"
                                onClick={() => window.location.href = '/login'}
                            >
                                Перейти к входу
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl text-green-600">Аккаунт активирован!</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-gray-600 mb-4">
                                Ваш аккаунт коуча успешно активирован. Теперь вы можете войти в систему.
                            </p>
                            <Alert className="mb-4">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Вы будете автоматически перенаправлены на страницу входа через несколько секунд.
                                </AlertDescription>
                            </Alert>
                            <Button
                                className="w-full"
                                onClick={() => window.location.href = '/login'}
                            >
                                Войти в систему
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-gray-800">Активация аккаунта</CardTitle>
                    <p className="text-gray-600 mt-2">
                        Установите пароль для завершения активации
                    </p>
                </CardHeader>
                <CardContent className="p-6">
                    {coachData && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">Данные аккаунта</h3>
                            <p className="text-sm text-blue-700">
                                <strong>Имя:</strong> {coachData.firstName} {coachData.lastName}
                            </p>
                            <p className="text-sm text-blue-700">
                                <strong>Email:</strong> {coachData.email}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleActivation} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Новый пароль</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Минимум 8 символов"
                                    className="pr-10"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </Button>
                            </div>

                            {/* Password strength indicator */}
                            {formData.password && (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                                style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-600">{passwordStrength.text}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Требования: минимум 8 символов, прописные и строчные буквы, цифры
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Повторите пароль"
                                    className="pr-10"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </Button>
                            </div>

                            {/* Password match indicator */}
                            {formData.confirmPassword && (
                                <div className="text-xs">
                                    {formData.password === formData.confirmPassword ? (
                                        <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Пароли совпадают
                    </span>
                                    ) : (
                                        <span className="text-red-600 flex items-center">
                      <XCircle className="h-3 w-3 mr-1" />
                      Пароли не совпадают
                    </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {error && (
                            <Alert className="mt-4">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || formData.password !== formData.confirmPassword || formData.password.length < 8}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Активирую аккаунт...
                                </>
                            ) : (
                                'Активировать аккаунт'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Уже есть аккаунт?{' '}
                            <a href="/login" className="text-blue-600 hover:text-blue-800">
                                Войти в систему
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CoachActivation;