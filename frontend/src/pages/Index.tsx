import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Автоматический редирект на страницу логина
        // Используем replace: true чтобы не создавать запись в истории браузера
        navigate('/login', { replace: true });
    }, [navigate]);

    // Показать загрузку пока происходит редирект
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                <p className="text-slate-600">Переадресация на страницу входа...</p>
                <p className="text-slate-400 text-sm mt-2">ditum.kz</p>
            </div>
        </div>
    );
};

export default Index;