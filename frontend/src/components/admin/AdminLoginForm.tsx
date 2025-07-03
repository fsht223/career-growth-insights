// frontend/src/components/admin/AdminLoginForm.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminLoginFormProps {
    onSuccess?: () => void;
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onSuccess }) => {
    const { login, isLoading, error } = useAdminAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const success = await login(formData.email, formData.password);
        if (success) {
            onSuccess?.();
            window.location.href = '/admin';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                        <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl text-gray-800">Вход администратора</CardTitle>
                    <p className="text-gray-600">Введите учетные данные для доступа к админской панели</p>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="admin@system.local"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Пароль</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <Alert className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !formData.email || !formData.password}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Вход...
                                </>
                            ) : (
                                'Войти в админку'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            <a href="/login" className="text-blue-600 hover:text-blue-800">
                                ← Обычный вход для коучей
                            </a>
                        </p>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-800">
                            <strong>По умолчанию:</strong><br />
                            Email: admin@system.local<br />
                            Пароль: Admin123!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminLoginForm;