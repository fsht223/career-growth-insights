// frontend/src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
    Settings, Users, FileText, Edit, Trash2, Plus, Lock, Unlock,
    BarChart3, Target, UserCheck, AlertCircle, Check, X, RefreshCw, LogOut
} from 'lucide-react';

// Interfaces
interface Stats {
    totalTests: number;
    completedTests: number;
    activeTests: number;
    totalCoaches: number;
    totalUsers: number;
    avgCompletionTime: number;
}

interface Coach {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    status: 'active' | 'pending' | 'inactive';
    createdAt: string;
    testsCreated: number;
}

interface Question {
    id: number;
    text: string;
    group: string;
    category: 'behavior' | 'motivation' | 'control';
    language: 'ru' | 'en';
}

interface NewCoach {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
}

interface EditingQuestion {
    id: number | null;
    text: string;
    group: string;
    category: 'behavior' | 'motivation' | 'control';
    language: 'ru' | 'en';
}

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAdminAuth();
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [selectedLanguage, setSelectedLanguage] = useState<'ru' | 'en'>('ru');
    const [showCreateCoachDialog, setShowCreateCoachDialog] = useState<boolean>(false);
    const [showEditQuestionDialog, setShowEditQuestionDialog] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State для данных с API
    const [stats, setStats] = useState<Stats>({
        totalTests: 0,
        completedTests: 0,
        activeTests: 0,
        totalCoaches: 0,
        totalUsers: 0,
        avgCompletionTime: 0
    });

    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);

    const [newCoach, setNewCoach] = useState<NewCoach>({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: ''
    });

    const [editingQuestion, setEditingQuestion] = useState<EditingQuestion>({
        id: null,
        text: '',
        group: '',
        category: 'behavior',
        language: 'ru'
    });

    // API функции
    const fetchStats = async () => {
        try {
            console.log('🔄 Fetching admin stats...');
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Stats API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Stats received:', data);

            setStats({
                totalTests: data.stats?.total_tests || 0,
                completedTests: data.stats?.completed_sessions || 0,
                activeTests: (data.stats?.total_tests || 0) - (data.stats?.completed_sessions || 0),
                totalCoaches: data.stats?.total_coaches || 0,
                totalUsers: data.stats?.total_participants || 0,
                avgCompletionTime: data.stats?.avg_completion_time || 0
            });
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
            setError('Ошибка загрузки статистики');
        }
    };

    const fetchCoaches = async () => {
        try {
            console.log('🔄 Fetching coaches...');
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/coaches', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Coaches API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Coaches received:', data);

            const mappedCoaches = data.map((coach: any) => ({
                id: coach.id,
                email: coach.email,
                firstName: coach.first_name,
                lastName: coach.last_name,
                status: coach.status,
                createdAt: coach.created_at,
                testsCreated: coach.tests_created || 0
            }));

            setCoaches(mappedCoaches);
        } catch (error) {
            console.error('❌ Error fetching coaches:', error);
            setError('Ошибка загрузки коучей');
        }
    };

    const fetchQuestions = async () => {
        try {
            console.log('🔄 Fetching questions...');
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/admin/questions?language=${selectedLanguage}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Questions API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Questions received:', data);

            const mappedQuestions = data.map((q: any) => ({
                id: q.id,
                text: q.question_text,
                group: q.motivational_group,
                category: q.category,
                language: q.language
            }));

            setQuestions(mappedQuestions);
        } catch (error) {
            console.error('❌ Error fetching questions:', error);
            setError('Ошибка загрузки вопросов');
        }
    };

    const createCoach = async () => {
        try {
            if (!newCoach.email || !newCoach.firstName || !newCoach.lastName || !newCoach.password) {
                setError('Все поля обязательны для заполнения');
                return;
            }

        if (newCoach.password !== newCoach.confirmPassword) {
                setError('Пароли не совпадают');
            return;
        }

            console.log('🔄 Creating coach...');
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/coaches', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                email: newCoach.email,
                firstName: newCoach.firstName,
                lastName: newCoach.lastName,
                    password: newCoach.password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка создания коуча');
            }

            const data = await response.json();
            console.log('✅ Coach created:', data);

            setNewCoach({
                email: '',
                firstName: '',
                lastName: '',
                password: '',
                confirmPassword: ''
            });
            setShowCreateCoachDialog(false);
            setError(null);

            await fetchCoaches();

        } catch (error) {
            console.error('❌ Error creating coach:', error);
            setError(error instanceof Error ? error.message : 'Ошибка создания коуча');
        }
    };

    const handleCreateQuestion = async () => {
        try {
            if (!editingQuestion.text || !editingQuestion.group) {
                setError('Текст вопроса и группа мотивации обязательны');
                return;
            }

            console.log('🔄 Creating/updating question...');
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/questions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: editingQuestion.id,
                    text: editingQuestion.text,
                    group: editingQuestion.group,
                    category: editingQuestion.category,
                    language: editingQuestion.language
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка сохранения вопроса');
            }

            const data = await response.json();
            console.log('✅ Question saved:', data);

        setEditingQuestion({
                id: null,
                text: '',
                group: '',
                category: 'behavior',
                language: 'ru'
            });
            setShowEditQuestionDialog(false);
            setError(null);

            await fetchQuestions();

        } catch (error) {
            console.error('❌ Error saving question:', error);
            setError(error instanceof Error ? error.message : 'Ошибка сохранения вопроса');
        }
    };

    const handleDeleteQuestion = async (questionId: number) => {
        if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
            return;
        }

        try {
            console.log('🔄 Deleting question...');
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/admin/questions/${questionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка удаления вопроса');
            }

            console.log('✅ Question deleted');
            await fetchQuestions();

        } catch (error) {
            console.error('❌ Error deleting question:', error);
            setError(error instanceof Error ? error.message : 'Ошибка удаления вопроса');
        }
    };

    const updateCoachStatus = async (coachId: number, newStatus: string) => {
        try {
            console.log('🔄 Updating coach status...');
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/admin/coaches/${coachId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка обновления статуса');
            }

            console.log('✅ Coach status updated');
            await fetchCoaches();

        } catch (error) {
            console.error('❌ Error updating coach status:', error);
            setError(error instanceof Error ? error.message : 'Ошибка обновления статуса');
        }
    };

    // Загрузка данных при монтировании компонента
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                await Promise.all([
                    fetchStats(),
                    fetchCoaches(),
                    fetchQuestions()
                ]);
            } catch (error) {
                console.error('❌ Error loading admin data:', error);
                setError('Ошибка загрузки данных админки');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadData();
        }
    }, [user]);

    // Перезагрузка вопросов при смене языка
    useEffect(() => {
        if (user && !loading) {
            fetchQuestions();
        }
    }, [selectedLanguage]);

    // Функция обновления данных
    const refreshData = async () => {
        setLoading(true);
        setError(null);
        await Promise.all([fetchStats(), fetchCoaches(), fetchQuestions()]);
        setLoading(false);
    };

    // Фильтрация коучей
    const filteredCoaches = coaches.filter(coach => {
        const matchesSearch =
            coach.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            coach.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            coach.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || coach.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Группы мотивации для вопросов
    const motivationalGroups = [
        'Perfectionism', 'Reaching Goals', 'Social Contact', 'Being Logical',
        'Bringing Happiness', 'Intuition', 'Success', 'Recognition',
        'Professional Pleasure', 'Resilience', 'Social Approval', 'Team Spirit',
        'Intellectual Discovery', 'Empathy', 'Influence', 'Respect', 'Value', 'Efficiency'
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Загрузка панели администратора...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <Settings className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Админская панель</h1>
                                <p className="text-sm text-gray-600">
                                    Добро пожаловать, {user?.firstName} {user?.lastName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button onClick={refreshData} variant="outline" size="sm" disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Обновить
                            </Button>
                            <Button onClick={logout} variant="outline" size="sm">
                                <LogOut className="h-4 w-4 mr-2" />
                                Выйти
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-400 hover:text-red-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Дашборд
                        </TabsTrigger>
                        <TabsTrigger value="coaches">
                            <Users className="h-4 w-4 mr-2" />
                            Коучи ({coaches.length})
                        </TabsTrigger>
                        <TabsTrigger value="questions">
                            <FileText className="h-4 w-4 mr-2" />
                            Вопросы ({questions.length})
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="h-4 w-4 mr-2" />
                            Настройки
                        </TabsTrigger>
                    </TabsList>

                    {/* Дашборд */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Всего тестов</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalTests}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Завершено: {stats.completedTests}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Коучи</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalCoaches}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Активных: {coaches.filter(c => c.status === 'active').length}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Участники</CardTitle>
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Уникальных пользователей
                                    </p>
                                </CardContent>
                            </Card>

                        <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Среднее время</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                    <div className="text-2xl font-bold">
                                        {Math.round(stats.avgCompletionTime)} мин
                                </div>
                                    <p className="text-xs text-muted-foreground">
                                        Прохождения теста
                                    </p>
                            </CardContent>
                        </Card>
                        </div>
                    </TabsContent>

                    {/* Коучи */}
                    <TabsContent value="coaches" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Управление коучами</h2>
                            <Button onClick={() => setShowCreateCoachDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Создать коуча
                            </Button>
                        </div>

                        {/* Фильтры */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Поиск по имени или email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Фильтр по статусу" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="active">Активные</SelectItem>
                                    <SelectItem value="pending">Ожидают</SelectItem>
                                    <SelectItem value="inactive">Неактивные</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Card>
                            <CardContent className="p-6">
                        <div className="space-y-4">
                                    {filteredCoaches.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">
                                                {coaches.length === 0 ? 'Коучи не найдены' : 'Нет коучей по выбранным фильтрам'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredCoaches.map((coach) => (
                                            <div key={coach.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex-1">
                                                    <h3 className="font-medium">{coach.firstName} {coach.lastName}</h3>
                                                        <p className="text-sm text-gray-500">{coach.email}</p>
                                                    <p className="text-xs text-gray-400">
                                                        Создан: {new Date(coach.createdAt).toLocaleDateString()}
                                                        • Тестов: {coach.testsCreated}
                                                    </p>
                                                    </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge
                                                        variant={
                                                            coach.status === 'active' ? 'default' :
                                                                coach.status === 'pending' ? 'secondary' : 'destructive'
                                                        }
                                                    >
                                                        {coach.status === 'active' ? 'Активен' :
                                                            coach.status === 'pending' ? 'Ожидает' : 'Неактивен'}
                                                    </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                        onClick={() => updateCoachStatus(coach.id, coach.status === 'active' ? 'inactive' : 'active')}
                                                >
                                                        {coach.status === 'active' ? (
                                                            <Lock className="h-4 w-4" />
                                                        ) : (
                                                        <Unlock className="h-4 w-4" />
                                                        )}
                                                </Button>
                                            </div>
                                            </div>
                                        ))
                                    )}
                                        </div>
                                    </CardContent>
                                </Card>
                    </TabsContent>

                    {/* Вопросы */}
                    <TabsContent value="questions" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-2xl font-bold">Управление вопросами</h2>
                                <Select value={selectedLanguage} onValueChange={(value: 'ru' | 'en') => setSelectedLanguage(value)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ru">Русский</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => {
                                setEditingQuestion({
                                    id: null,
                                    text: '',
                                    group: '',
                                    category: 'behavior',
                                    language: selectedLanguage
                                });
                                setShowEditQuestionDialog(true);
                            }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Добавить вопрос
                            </Button>
                        </div>

                        <Card>
                            <CardContent className="p-6">
                        <div className="space-y-4">
                                    {questions.length === 0 ? (
                                        <div className="text-center py-8">
                                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">Вопросы не найдены</p>
                                        </div>
                                    ) : (
                                        questions.map((question) => (
                                            <div key={question.id} className="p-4 border rounded-lg">
                                                <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                        <p className="font-medium">{question.text}</p>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <Badge variant="outline">{question.group}</Badge>
                                                            <Badge variant="secondary">{question.category}</Badge>
                                                            <Badge variant="outline">{question.language}</Badge>
                                                    </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingQuestion({
                                                                    id: question.id,
                                                                    text: question.text,
                                                                    group: question.group,
                                                                    category: question.category,
                                                                    language: question.language
                                                                });
                                                                setShowEditQuestionDialog(true);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteQuestion(question.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                        </div>
                                    </CardContent>
                                </Card>
                    </TabsContent>

                    {/* Настройки */}
                    <TabsContent value="settings" className="space-y-6">
                        <h2 className="text-2xl font-bold">Системные настройки</h2>
                            <Card>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>Версия системы:</span>
                                        <span>1.0.0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>База данных:</span>
                                        <span className="text-green-600">Подключена</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Email сервис:</span>
                                        <span className="text-green-600">Активен</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Последнее обновление:</span>
                                        <span>{new Date().toLocaleString()}</span>
                                    </div>
                                    </div>
                                </CardContent>
                            </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Dialog для создания коуча */}
            <Dialog open={showCreateCoachDialog} onOpenChange={setShowCreateCoachDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Создание нового коуча</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="coach-email">Email *</Label>
                            <Input
                                id="coach-email"
                                type="email"
                                value={newCoach.email}
                                onChange={(e) => setNewCoach({...newCoach, email: e.target.value})}
                                placeholder="coach@example.com"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="coach-firstName">Имя *</Label>
                                <Input
                                    id="coach-firstName"
                                    value={newCoach.firstName}
                                    onChange={(e) => setNewCoach({...newCoach, firstName: e.target.value})}
                                    placeholder="Имя"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coach-lastName">Фамилия *</Label>
                                <Input
                                    id="coach-lastName"
                                    value={newCoach.lastName}
                                    onChange={(e) => setNewCoach({...newCoach, lastName: e.target.value})}
                                    placeholder="Фамилия"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coach-password">Пароль *</Label>
                            <Input
                                id="coach-password"
                                type="password"
                                value={newCoach.password}
                                onChange={(e) => setNewCoach({...newCoach, password: e.target.value})}
                                placeholder="Минимум 8 символов"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coach-confirmPassword">Подтвердите пароль *</Label>
                            <Input
                                id="coach-confirmPassword"
                                type="password"
                                value={newCoach.confirmPassword}
                                onChange={(e) => setNewCoach({...newCoach, confirmPassword: e.target.value})}
                                placeholder="Повторите пароль"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                onClick={createCoach}
                                disabled={!newCoach.email || !newCoach.firstName || !newCoach.lastName || !newCoach.password}
                            >
                                Создать коуча
                            </Button>
                            <Button variant="outline" onClick={() => setShowCreateCoachDialog(false)}>
                                Отмена
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog для редактирования вопросов */}
            <Dialog open={showEditQuestionDialog} onOpenChange={setShowEditQuestionDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingQuestion.id ? 'Редактировать вопрос' : 'Добавить новый вопрос'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="question-text">Текст вопроса *</Label>
                            <Textarea
                                id="question-text"
                                value={editingQuestion.text}
                                onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                                placeholder="Введите текст вопроса..."
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                                <Label htmlFor="question-group">Группа мотивации *</Label>
                            <Select
                                value={editingQuestion.group}
                                    onValueChange={(value) => setEditingQuestion({...editingQuestion, group: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите группу" />
                                </SelectTrigger>
                                <SelectContent>
                                    {motivationalGroups.map(group => (
                                        <SelectItem key={group} value={group}>{group}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-category">Категория</Label>
                                <Select
                                    value={editingQuestion.category}
                                    onValueChange={(value: 'behavior' | 'motivation' | 'control') =>
                                        setEditingQuestion({...editingQuestion, category: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="behavior">Поведенческий</SelectItem>
                                        <SelectItem value="motivation">Мотивационный</SelectItem>
                                        <SelectItem value="control">Контрольный</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-language">Язык</Label>
                                <Select
                                    value={editingQuestion.language}
                                    onValueChange={(value: 'ru' | 'en') =>
                                    setEditingQuestion({...editingQuestion, language: value})}
                                >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ru">Русский</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleCreateQuestion}
                                disabled={!editingQuestion.text || !editingQuestion.group}
                            >
                                {editingQuestion.id ? 'Сохранить изменения' : 'Добавить вопрос'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowEditQuestionDialog(false)}>
                                Отмена
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDashboard;