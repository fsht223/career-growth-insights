
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - in real app this would be an API call
    setTimeout(() => {
      if (email && password) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'coach');
        toast({
          title: "Успешный вход",
          description: "Добро пожаловать в систему!",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Ошибка входа",
          description: "Проверьте email и пароль",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
          <p className="text-blue-100 mt-2">Платформа тестирования</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="coach@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-300 focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-300 focus:border-blue-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 transition-colors"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-slate-600 hover:text-blue-800"
            >
              Забыли пароль?
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
