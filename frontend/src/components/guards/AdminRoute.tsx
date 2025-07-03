// frontend/src/components/guards/AdminRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface AdminRouteProps {
    children: React.ReactNode;
}

interface AdminUser {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAdminAuth();
    }, []);

    const checkAdminAuth = async () => {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');

            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await fetch('/api/admin/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user && data.user.role === 'admin') {
                    setIsAdmin(true);
                } else {
                    setError('Недостаточно прав доступа');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Ошибка авторизации');
            }
        } catch (error) {
            console.error('Error checking admin auth:', error);
            setError('Ошибка соединения с сервером');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <span className="text-lg">Проверка прав доступа...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-red-600 mb-2">Доступ запрещен</h2>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => window.location.href = '/admin/login'}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                                >
                                    Войти как администратор
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                                >
                                    На главную
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;