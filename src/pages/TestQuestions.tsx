
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Question {
  id: number;
  text: string;
  options: Array<{
    id: string;
    text: string;
    group: string;
  }>;
}

const TestQuestions = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { first: string; second: string }>>({});
  const [selectedFirst, setSelectedFirst] = useState<string>('');
  const [selectedSecond, setSelectedSecond] = useState<string>('');
  const [motivationalButtons, setMotivationalButtons] = useState<string[]>([]);
  const [showMotivationalSelection, setShowMotivationalSelection] = useState(false);

  // Mock questions (in real app, this would come from API)
  const questions: Question[] = [
    {
      id: 1,
      text: "Какое из следующих утверждений лучше описывает вас?",
      options: [
        { id: "1a", text: "Я предпочитаю работать с фактами и данными", group: "analytical" },
        { id: "1b", text: "Я полагаюсь на интуицию и творческий подход", group: "creative" },
        { id: "1c", text: "Я фокусируюсь на людях и отношениях", group: "social" }
      ]
    },
    {
      id: 2,
      text: "Какое из следующих утверждений лучше описывает вас?",
      options: [
        { id: "2a", text: "Я предпочитаю планировать заранее", group: "organized" },
        { id: "2b", text: "Я адаптируюсь к изменениям", group: "flexible" },
        { id: "2c", text: "Я принимаю быстрые решения", group: "decisive" }
      ]
    },
    // Add more questions as needed...
  ];

  const motivationalOptions = [
    "Признание достижений",
    "Финансовая стабильность", 
    "Творческая свобода",
    "Лидерство команды",
    "Профессиональный рост",
    "Работа в команде",
    "Автономность",
    "Инновации",
    "Стабильность",
    "Влияние на решения",
    "Обучение других",
    "Решение сложных задач",
    "Построение отношений",
    "Достижение целей",
    "Баланс работы и жизни",
    "Статус и престиж",
    "Помощь другим",
    "Конкурентность"
  ];

  const totalQuestions = 40;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  useEffect(() => {
    // Check if user has completed registration
    const userData = localStorage.getItem('testUserData');
    if (!userData) {
      navigate(`/test/${testId}`);
    }
  }, [testId, navigate]);

  const handleFirstSelection = (optionId: string) => {
    setSelectedFirst(optionId);
  };

  const handleSecondSelection = (optionId: string) => {
    setSelectedSecond(optionId);
  };

  const handleNext = () => {
    if (!selectedFirst || !selectedSecond) {
      toast({
        title: "Выберите два варианта",
        description: "Пожалуйста, выберите первый и второй варианты ответа",
        variant: "destructive",
      });
      return;
    }

    // Save answers
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: {
        first: selectedFirst,
        second: selectedSecond
      }
    }));

    // Reset selections
    setSelectedFirst('');
    setSelectedSecond('');

    // Move to next question or show motivational selection
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (currentQuestion === 38) { // After question 39 (0-indexed)
      setShowMotivationalSelection(true);
    } else {
      // Test completed
      handleTestCompletion();
    }
  };

  const handleMotivationalSelection = (option: string) => {
    if (motivationalButtons.includes(option)) {
      setMotivationalButtons(prev => prev.filter(item => item !== option));
    } else if (motivationalButtons.length < 5) {
      setMotivationalButtons(prev => [...prev, option]);
    } else {
      toast({
        title: "Максимум 5 вариантов",
        description: "Вы можете выбрать не более 5 мотивационных факторов",
        variant: "destructive",
      });
    }
  };

  const handleTestCompletion = () => {
    // Save test results
    const testResults = {
      answers,
      motivationalButtons,
      completedAt: new Date().toISOString(),
      testId
    };
    
    localStorage.setItem('testResults', JSON.stringify(testResults));
    navigate(`/test/${testId}/results`);
  };

  if (showMotivationalSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Progress value={95} className="h-3 bg-slate-200" />
            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>Вопрос 40 из 40</span>
              <span>95%</span>
            </div>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                Выберите 5 наиболее важных для вас мотивационных факторов
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {motivationalOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant={motivationalButtons.includes(option) ? "default" : "outline"}
                    className={`p-4 h-auto text-left justify-start transition-all ${
                      motivationalButtons.includes(option)
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                    onClick={() => handleMotivationalSelection(option)}
                  >
                    <div className="flex items-center space-x-2">
                      {motivationalButtons.includes(option) && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm">{option}</span>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Выбрано: {motivationalButtons.length} из 5
                </p>
                <Button
                  onClick={handleTestCompletion}
                  disabled={motivationalButtons.length !== 5}
                  className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white px-8 py-3"
                >
                  Завершить тест
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentQuestion >= questions.length) {
    return <div>Loading...</div>;
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-3 bg-slate-200" />
          <div className="flex justify-between text-sm text-slate-600 mt-2">
            <span>Вопрос {currentQuestion + 1} из {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Question */}
        <Card className="shadow-xl border-0 mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
              {question.text}
            </h2>

            {/* First Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">
                Выберите первый наиболее подходящий вариант:
              </h3>
              <div className="space-y-3">
                {question.options.map((option) => (
                  <Button
                    key={option.id}
                    variant={selectedFirst === option.id ? "default" : "outline"}
                    className={`w-full p-4 h-auto text-left justify-start transition-all ${
                      selectedFirst === option.id
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                    onClick={() => handleFirstSelection(option.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {selectedFirst === option.id && (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      <span>{option.text}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Second Selection */}
            {selectedFirst && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">
                  Теперь выберите второй наиболее подходящий вариант:
                </h3>
                <div className="space-y-3">
                  {question.options
                    .filter(option => option.id !== selectedFirst)
                    .map((option) => (
                      <Button
                        key={option.id}
                        variant={selectedSecond === option.id ? "default" : "outline"}
                        className={`w-full p-4 h-auto text-left justify-start transition-all ${
                          selectedSecond === option.id
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'hover:bg-rose-50 hover:border-rose-300'
                        }`}
                        onClick={() => handleSecondSelection(option.id)}
                      >
                        <div className="flex items-center space-x-3">
                          {selectedSecond === option.id && (
                            <CheckCircle className="w-5 h-5" />
                          )}
                          <span>{option.text}</span>
                        </div>
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Next Button */}
            {selectedFirst && selectedSecond && (
              <div className="text-center">
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white px-8 py-3"
                >
                  {currentQuestion < questions.length - 1 ? 'Следующий вопрос' : 'Продолжить'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestQuestions;
