// frontend/src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
    Settings,
    Users,
    FileText,
    Eye,
    Edit,
    Trash2,
    Plus,
    Lock,
    Unlock,
    Mail,
    Calendar as CalendarIcon,
    BarChart3,
    Globe,
    Target,
    UserCheck,
    AlertCircle,
    Check,
    X,
    Download,
    Search,
    Filter,
    RefreshCw
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

interface GoldenLineValues {
    [key: string]: number;
}

interface GoldenLine {
    id: number;
    profession: string;
    values: GoldenLineValues;
    language: 'ru' | 'en';
}

interface TestResult {
    id: number;
    testId: string;
    userName: string;
    email: string;
    profession: string;
    completedAt: string;
    status: 'completed' | 'in_progress';
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

interface EditingGoldenLine {
    id: number | null;
    profession: string;
    values: GoldenLineValues;
    language: 'ru' | 'en';
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [selectedLanguage, setSelectedLanguage] = useState<'ru' | 'en'>('ru');
    const [dateRange, setDateRange] = useState({ from: new Date(2024, 0, 1), to: new Date() });
    const [showCreateCoachDialog, setShowCreateCoachDialog] = useState<boolean>(false);
    const [showEditQuestionDialog, setShowEditQuestionDialog] = useState<boolean>(false);
    const [showGoldenLineDialog, setShowGoldenLineDialog] = useState<boolean>(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // State with proper types
    const [stats, setStats] = useState<Stats>({
        totalTests: 247,
        completedTests: 189,
        activeTests: 58,
        totalCoaches: 12,
        totalUsers: 1342,
        avgCompletionTime: 18.5
    });

    const [coaches, setCoaches] = useState<Coach[]>([
        { id: 1, email: 'coach1@example.com', firstName: 'Анна', lastName: 'Иванова', status: 'active', createdAt: '2024-01-15', testsCreated: 23 },
        { id: 2, email: 'coach2@example.com', firstName: 'Петр', lastName: 'Петров', status: 'pending', createdAt: '2024-02-20', testsCreated: 15 },
        { id: 3, email: 'coach3@example.com', firstName: 'Мария', lastName: 'Сидорова', status: 'active', createdAt: '2024-03-10', testsCreated: 31 }
    ]);

    const [questions, setQuestions] = useState<Question[]>([
        { id: 1, text: 'Я обеспечиваю соответствие моей работы высшим стандартам', group: 'Perfectionism', category: 'behavior', language: 'ru' },
        { id: 2, text: 'Я делаю все необходимое для достижения моих целей', group: 'Reaching Goals', category: 'behavior', language: 'ru' },
        { id: 3, text: 'Я придаю значение социальному взаимодействию с коллегами', group: 'Social Contact', category: 'behavior', language: 'ru' },
        { id: 4, text: 'I ensure my work meets the highest standards', group: 'Perfectionism', category: 'behavior', language: 'en' }
    ]);

    const [goldenLines, setGoldenLines] = useState<GoldenLine[]>([
        { id: 1, profession: 'C Level', values: { perfectionism: 85, reaching_goals: 95, social_contact: 70 }, language: 'ru' },
        { id: 2, profession: 'Маркетинг', values: { perfectionism: 75, reaching_goals: 85, social_contact: 90 }, language: 'ru' },
        { id: 3, profession: 'Продажи', values: { perfectionism: 65, reaching_goals: 95, social_contact: 85 }, language: 'ru' },
        { id: 4, profession: 'HR', values: { perfectionism: 70, reaching_goals: 80, social_contact: 95 }, language: 'ru' }
    ]);

    const [testResults, setTestResults] = useState<TestResult[]>([
        { id: 1, testId: 'uuid-1', userName: 'Иван Петров', email: 'ivan@example.com', profession: 'Маркетинг', completedAt: '2024-01-15T10:30:00Z', status: 'completed' },
        { id: 2, testId: 'uuid-2', userName: 'Анна Сидорова', email: 'anna@example.com', profession: 'Продажи', completedAt: '2024-01-16T14:20:00Z', status: 'completed' },
        { id: 3, testId: 'uuid-3', userName: 'Петр Иванов', email: 'petr@example.com', profession: 'HR', completedAt: '2024-01-17T09:15:00Z', status: 'in_progress' }
    ]);

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

    const [editingGoldenLine, setEditingGoldenLine] = useState<EditingGoldenLine>({
        id: null,
        profession: '',
        values: {},
        language: 'ru'
    });

    const motivationalGroups: string[] = [
        'Perfectionism', 'Reaching Goals', 'Social Contact', 'Being Logical', 'Bringing Happiness',
        'Intuition', 'Success', 'Recognition', 'Professional Pleasure', 'Resilience',
        'Social Approval', 'Team Spirit', 'Intellectual Discovery', 'Empathy', 'Influence',
        'Respect', 'Value', 'Efficiency'
    ];

    const professions: string[] = [
        'C Level', 'Маркетинг', 'Продажи', 'HR', 'IT', 'Финансы', 'Операции', 'Консалтинг', 'Образование', 'Другое'
    ];

    // Handlers with proper types
    const handleCreateCoach = async (): Promise<void> => {
        if (newCoach.password !== newCoach.confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        try {
            const newCoachData: Coach = {
                id: coaches.length + 1,
                email: newCoach.email,
                firstName: newCoach.firstName,
                lastName: newCoach.lastName,
                status: 'pending',
                createdAt: new Date().toISOString(),
                testsCreated: 0
            };

            setCoaches([...coaches, newCoachData]);
            setShowCreateCoachDialog(false);
            setNewCoach({ email: '', firstName: '', lastName: '', password: '', confirmPassword: '' });

            alert(`Письмо с подтверждением отправлено на ${newCoach.email}`);
        } catch (error) {
            alert('Ошибка при создании коуча');
        }
    };

    const handleDeleteCoach = (coachId: number): void => {
        if (confirm('Вы уверены, что хотите удалить этого коуча?')) {
            setCoaches(coaches.filter(coach => coach.id !== coachId));
        }
    };

    const handleToggleCoachStatus = (coachId: number): void => {
        setCoaches(coaches.map(coach =>
            coach.id === coachId
                ? { ...coach, status: coach.status === 'active' ? 'inactive' : 'active' }
                : coach
        ));
    };

    const handleEditQuestion = (question: Question): void => {
        setEditingQuestion({
            id: question.id,
            text: question.text,
            group: question.group,
            category: question.category,
            language: question.language
        });
        setSelectedQuestion(question);
        setShowEditQuestionDialog(true);
    };

    const handleSaveQuestion = (): void => {
        if (editingQuestion.id) {
            setQuestions(questions.map(q =>
                q.id === editingQuestion.id ? { ...editingQuestion, id: editingQuestion.id } : q
            ));
        } else {
            const newQuestion: Question = {
                ...editingQuestion,
                id: questions.length + 1
            };
            setQuestions([...questions, newQuestion]);
        }
        setShowEditQuestionDialog(false);
        setEditingQuestion({ id: null, text: '', group: '', category: 'behavior', language: 'ru' });
    };

    const handleDeleteQuestion = (questionId: number): void => {
        if (confirm('Вы уверены, что хотите удалить этот вопрос?')) {
            setQuestions(questions.filter(q => q.id !== questionId));
        }
    };

    const handleEditGoldenLine = (goldenLine: GoldenLine): void => {
        setEditingGoldenLine({
            id: goldenLine.id,
            profession: goldenLine.profession,
            values: { ...goldenLine.values },
            language: goldenLine.language
        });
        setShowGoldenLineDialog(true);
    };

    const handleSaveGoldenLine = (): void => {
        if (editingGoldenLine.id) {
            setGoldenLines(goldenLines.map(gl =>
                gl.id === editingGoldenLine.id ? { ...editingGoldenLine, id: editingGoldenLine.id } : gl
            ));
        } else {
            const newGoldenLine: GoldenLine = {
                ...editingGoldenLine,
                id: goldenLines.length + 1
            };
            setGoldenLines([...goldenLines, newGoldenLine]);
        }
        setShowGoldenLineDialog(false);
        setEditingGoldenLine({ id: null, profession: '', values: {}, language: 'ru' });
    };

    const filteredTestResults = testResults.filter(test => {
        const matchesSearch = test.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredQuestions = questions.filter(q => q.language === selectedLanguage);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Settings className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Админская панель</h1>
                                <p className="text-gray-600">Управление системой тестирования</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Select value={selectedLanguage} onValueChange={(value: 'ru' | 'en') => setSelectedLanguage(value)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                                    <SelectItem value="en">🇺🇸 English</SelectItem>
                                </SelectContent>
                            </Select>
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                                Администратор
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-6 mb-6">
                        <TabsTrigger value="overview">Обзор</TabsTrigger>
                        <TabsTrigger value="questions">Вопросы</TabsTrigger>
                        <TabsTrigger value="golden-lines">Golden Lines</TabsTrigger>
                        <TabsTrigger value="coaches">Коучи</TabsTrigger>
                        <TabsTrigger value="tests">Тесты</TabsTrigger>
                        <TabsTrigger value="settings">Настройки</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                    <CardTitle className="text-sm font-medium">Активные коучи</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalCoaches}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Участников: {stats.totalUsers}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Среднее время</CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.avgCompletionTime} мин</div>
                                    <p className="text-xs text-muted-foreground">
                                        Прохождения теста
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Статистика по дням</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">График статистики (интеграция с графиками)</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="questions" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Управление вопросами</h2>
                            <Button
                                onClick={() => {
                                    setEditingQuestion({ id: null, text: '', group: '', category: 'behavior', language: selectedLanguage });
                                    setShowEditQuestionDialog(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Добавить вопрос
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {filteredQuestions.map((question) => (
                                <Card key={question.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
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
                                                    onClick={() => handleEditQuestion(question)}
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
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="golden-lines" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Golden Lines (Эталонные значения)</h2>
                            <Button
                                onClick={() => {
                                    setEditingGoldenLine({ id: null, profession: '', values: {}, language: selectedLanguage });
                                    setShowGoldenLineDialog(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Добавить эталон
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goldenLines.filter(gl => gl.language === selectedLanguage).map((goldenLine) => (
                                <Card key={goldenLine.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{goldenLine.profession}</CardTitle>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditGoldenLine(goldenLine)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {Object.entries(goldenLine.values).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">{key}:</span>
                                                    <Badge variant="secondary">{value}%</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="coaches" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Управление коучами</h2>
                            <Button onClick={() => setShowCreateCoachDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Создать коуча
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {coaches.map((coach) => (
                                <Card key={coach.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <p className="font-medium">{coach.firstName} {coach.lastName}</p>
                                                        <p className="text-sm text-gray-500">{coach.email}</p>
                                                    </div>
                                                    <Badge
                                                        variant={coach.status === 'active' ? 'default' :
                                                            coach.status === 'pending' ? 'secondary' : 'destructive'}
                                                    >
                                                        {coach.status === 'active' ? 'Активен' :
                                                            coach.status === 'pending' ? 'Ожидает' : 'Неактивен'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                                    <span>Создан: {new Date(coach.createdAt).toLocaleDateString()}</span>
                                                    <span>Тестов: {coach.testsCreated}</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleCoachStatus(coach.id)}
                                                >
                                                    {coach.status === 'active' ?
                                                        <Lock className="h-4 w-4" /> :
                                                        <Unlock className="h-4 w-4" />
                                                    }
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => alert(`Письмо сброса пароля отправлено на ${coach.email}`)}
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteCoach(coach.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="tests" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Результаты тестов</h2>
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="Поиск по имени или email..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className="w-64"
                                />
                                <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все статусы</SelectItem>
                                        <SelectItem value="completed">Завершенные</SelectItem>
                                        <SelectItem value="in_progress">В процессе</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredTestResults.map((test) => (
                                <Card key={test.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <p className="font-medium">{test.userName}</p>
                                                        <p className="text-sm text-gray-500">{test.email}</p>
                                                    </div>
                                                    <Badge variant="outline">{test.profession}</Badge>
                                                    <Badge
                                                        variant={test.status === 'completed' ? 'default' : 'secondary'}
                                                    >
                                                        {test.status === 'completed' ? 'Завершен' : 'В процессе'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    {test.status === 'completed' ?
                                                        `Завершен: ${new Date(test.completedAt).toLocaleDateString()}` :
                                                        'Тест в процессе выполнения'
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Системные настройки</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="registration">Регистрация новых коучей</Label>
                                        <Switch id="registration" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="notifications">Email уведомления</Label>
                                        <Switch id="notifications" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="analytics">Аналитика</Label>
                                        <Switch id="analytics" defaultChecked />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Языковые настройки</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Русский язык</Label>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>English</Label>
                                        <Switch defaultChecked />
                                    </div>
                                    <Button variant="outline" className="w-full">
                                        Управление переводами
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Create Coach Dialog */}
            <Dialog open={showCreateCoachDialog} onOpenChange={setShowCreateCoachDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Создать нового коуча</DialogTitle>
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
                                onClick={handleCreateCoach}
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

            {/* Edit Question Dialog */}
            <Dialog open={showEditQuestionDialog} onOpenChange={setShowEditQuestionDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingQuestion.id ? 'Редактировать вопрос' : 'Добавить вопрос'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="question-text">Текст вопроса *</Label>
                            <Textarea
                                id="question-text"
                                value={editingQuestion.text}
                                onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                                placeholder="Введите текст вопроса"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="question-group">Мотивационная группа *</Label>
                            <Select
                                value={editingQuestion.group}
                                onValueChange={(value: string) => setEditingQuestion({...editingQuestion, group: value})}
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="question-category">Категория</Label>
                                <Select
                                    value={editingQuestion.category}
                                    onValueChange={(value: 'behavior' | 'motivation' | 'control') =>
                                        setEditingQuestion({...editingQuestion, category: value})
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите категорию" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="behavior">Поведение</SelectItem>
                                        <SelectItem value="motivation">Мотивация</SelectItem>
                                        <SelectItem value="control">Контрольный</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-language">Язык</Label>
                                <Select
                                    value={editingQuestion.language}
                                    onValueChange={(value: 'ru' | 'en') =>
                                        setEditingQuestion({...editingQuestion, language: value})
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите язык" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ru">Русский</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleSaveQuestion}
                                disabled={!editingQuestion.text || !editingQuestion.group}
                            >
                                Сохранить
                            </Button>
                            <Button variant="outline" onClick={() => setShowEditQuestionDialog(false)}>
                                Отмена
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Golden Line Dialog */}
            {/* Edit Question Dialog */}
            <Dialog open={showEditQuestionDialog} onOpenChange={setShowEditQuestionDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingQuestion.id ? 'Редактировать вопрос' : 'Добавить вопрос'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="question-text">Текст вопроса *</Label>
                            <Textarea
                                id="question-text"
                                value={editingQuestion.text}
                                onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                                placeholder="Введите текст вопроса"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="question-group">Мотивационная группа *</Label>
                            <Select
                                value={editingQuestion.group}
                                onValueChange={(value: string) => setEditingQuestion({...editingQuestion, group: value})}
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="question-category">Категория</Label>
                                <Select
                                    value={editingQuestion.category}
                                    onValueChange={(value: 'behavior' | 'motivation' | 'control') =>
                                        setEditingQuestion({...editingQuestion, category: value})
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите категорию" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="behavior">Поведение</SelectItem>
                                        <SelectItem value="motivation">Мотивация</SelectItem>
                                        <SelectItem value="control">Контрольный</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="question-language">Язык</Label>
                                <Select
                                    value={editingQuestion.language}
                                    onValueChange={(value: 'ru' | 'en') =>
                                        setEditingQuestion({...editingQuestion, language: value})
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите язык" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ru">Русский</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleSaveQuestion}
                                disabled={!editingQuestion.text || !editingQuestion.group}
                            >
                                Сохранить
                            </Button>
                            <Button variant="outline" onClick={() => setShowEditQuestionDialog(false)}>
                                Отмена
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Golden Line Dialog */}
            <Dialog open={showGoldenLineDialog} onOpenChange={setShowGoldenLineDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGoldenLine.id ? 'Редактировать Golden Line' : 'Добавить Golden Line'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="golden-profession">Профессия *</Label>
                                <Select
                                    value={editingGoldenLine.profession}
                                    onValueChange={(value: string) =>
                                        setEditingGoldenLine({...editingGoldenLine, profession: value})
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите профессию" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {professions.map(profession => (
                                            <SelectItem key={profession} value={profession}>{profession}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="golden-language">Язык</Label>
                                <Select
                                    value={editingGoldenLine.language}
                                    onValueChange={(value: 'ru' | 'en') =>
                                        setEditingGoldenLine({...editingGoldenLine, language: value})
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите язык" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ru">Русский</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label>Эталонные значения (%)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {motivationalGroups.slice(0, 6).map(group => (
                                    <div key={group} className="space-y-2">
                                        <Label htmlFor={`golden-${group}`} className="text-sm">{group}</Label>
                                        <Input
                                            id={`golden-${group}`}
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={editingGoldenLine.values[group.toLowerCase().replace(/\s+/g, '_')] || ''}
                                            onChange={(e) => setEditingGoldenLine({
                                                ...editingGoldenLine,
                                                values: {
                                                    ...editingGoldenLine.values,
                                                    [group.toLowerCase().replace(/\s+/g, '_')]: parseInt(e.target.value) || 0
                                                }
                                            })}
                                            placeholder="0-200"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleSaveGoldenLine}
                                disabled={!editingGoldenLine.profession}
                            >
                                Сохранить
                            </Button>
                            <Button variant="outline" onClick={() => setShowGoldenLineDialog(false)}>
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