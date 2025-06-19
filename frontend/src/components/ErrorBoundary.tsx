// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-xl border-0">
            <CardHeader className="text-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <AlertTriangle className="w-8 h-8" />
                <CardTitle className="text-2xl font-bold">Произошла ошибка</CardTitle>
              </div>
              <p className="text-red-100">Что-то пошло не так</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Описание ошибки:
                  </h3>
                  <div className="bg-slate-100 p-4 rounded-lg">
                    <p className="text-sm text-slate-700 font-mono">
                      {this.state.error?.message || 'Неизвестная ошибка'}
                    </p>
                  </div>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      Стек ошибки:
                    </h3>
                    <div className="bg-slate-100 p-4 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Что можно сделать:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-600">
                    <li>Обновите страницу</li>
                    <li>Вернитесь на главную страницу</li>
                    <li>Очистите кэш браузера</li>
                    <li>Обратитесь в техническую поддержку</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={this.handleReload}
                    className="bg-blue-900 hover:bg-blue-800 text-white flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Обновить страницу
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1"
                  >
                    Вернуться на главную
                  </Button>
                </div>

                <div className="text-center pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Если проблема повторяется, обратитесь в службу поддержки
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;