// frontend/src/hooks/useAdminAuth.ts
import { useState, useEffect } from 'react';

interface AdminUser {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface UseAdminAuthReturn {
    user: AdminUser | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAdmin: boolean;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('adminToken');

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
                setUser(data.user);
            } else {
                localStorage.removeItem('adminToken');
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            localStorage.removeItem('adminToken');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                setUser(data.user);
                return true;
            } else {
                setError(data.error || 'Ошибка входа');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Ошибка соединения с сервером');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setUser(null);
        window.location.href = '/admin/login';
    };

    const isAdmin = user?.role === 'admin';

    return {
        user,
        isLoading,
        error,
        login,
        logout,
        isAdmin
    };
};