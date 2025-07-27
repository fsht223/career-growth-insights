// src/pages/TestQuestions.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, ArrowRight, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";
import ApiService from '@/services/api';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuestionTranslation, useMotivationalFactorTranslation, useOptionTextTranslation } from '@/utils/translationUtils';

interface Question {
  id: number;
  text: string;
  type?: string;
  isRepeat?: boolean;
  options: Array<{
    id: string;
    text: string;
    group?: string;
  }>;
}

const TestQuestions = () => {
  const { t } = useTranslation();
  const { translateQuestionText } = useQuestionTranslation();
  const { translateMotivationalFactor } = useMotivationalFactorTranslation();
  const { translateOptionText } = useOptionTextTranslation();
  const { testId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { first: string; second: string }>>({});
  const [selectedFirst, setSelectedFirst] = useState<string>('');
  const [selectedSecond, setSelectedSecond] = useState<string>('');
  const [motivationalButtons, setMotivationalButtons] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const autoSaveInterval = useRef<NodeJS.Timeout>();
  const lastSaveTime = useRef<Date>(new Date());

  useEffect(() => {
    loadTestData();
    
    // Set up beforeunload handler for browser close/refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentQuestion > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [testId]);

  useEffect(() => {
    // Auto-save every 30 seconds
    if (autoSaveEnabled && sessionId) {
      autoSaveInterval.current = setInterval(() => {
        saveProgress();
      }, 30000);
    }

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [autoSaveEnabled, sessionId, currentQuestion]);

  const loadTestData = async () => {
    try {
      setLoading(true);
      
      // Check if user has session data
      const sessionData = localStorage.getItem('currentTestSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.testId === testId) {
          setSessionId(session.sessionId);
          setCurrentQuestion(session.currentQuestion || 0);
          setAnswers(session.answers || {});
          setMotivationalButtons(session.motivationalButtons || []);
        }
      }

      // Load questions from API
      const questionsData = await ApiService.getTestQuestions(testId!);
      setQuestions(questionsData);
      
    } catch (error) {
      console.error('Failed to load test data:', error);
      toast({
        title: t('testQuestions.error'),
        description: t('testQuestions.error'),
        variant: "destructive",
      });
      navigate(`/test/${testId}`);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (force = false) => {
    if (!sessionId || saving) return;

    // Don't save too frequently unless forced
    const now = new Date();
    if (!force && now.getTime() - lastSaveTime.current.getTime() < 10000) {
      return;
    }

    try {
      setSaving(true);
      
      // Save current answers
      if (selectedFirst && selectedSecond && currentQuestion < 39) {
        const updatedAnswers = {
          ...answers,
          [currentQuestion]: {
            first: selectedFirst,
            second: selectedSecond
          }
        };
        setAnswers(updatedAnswers);
      }

      const sessionData = {
        sessionId,
        testId,
        currentQuestion,
        answers: currentQuestion < 39 ? {
          ...answers,
          ...(selectedFirst && selectedSecond ? {
            [currentQuestion]: { first: selectedFirst, second: selectedSecond }
          } : {})
        } : answers,
        motivationalButtons,
        lastSaved: now.toISOString()
      };

      // Save to localStorage
      localStorage.setItem('currentTestSession', JSON.stringify(sessionData));

      // Save to server
      await ApiService.saveAnswer(testId!, {
        sessionId,
        questionId: currentQuestion,
        answer: currentQuestion < 39 ? { first: selectedFirst, second: selectedSecond } : undefined,
        motivationalSelection: currentQuestion === 39 ? motivationalButtons : undefined
      });

      lastSaveTime.current = now;
      
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast({
        title: t('testQuestions.saveError'),
        description: t('testQuestions.saveErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFirstSelection = (optionId: string) => {
    // Only allow selection if no first option is selected yet
    if (!selectedFirst) {
      setSelectedFirst(optionId);
      setSelectedSecond(''); // Reset second selection
    }
  };

  const handleSecondSelection = (optionId: string) => {
    // Only allow selection if no second option is selected yet and first is selected
    if (!selectedSecond && selectedFirst) {
      setSelectedSecond(optionId);
    }
  };

  const handleMotivationalSelection = (option: string) => {
    if (motivationalButtons.includes(option)) {
      setMotivationalButtons(prev => prev.filter(item => item !== option));
    } else if (motivationalButtons.length < 5) {
      setMotivationalButtons(prev => [...prev, option]);
    } else {
      toast({
        title: t('testQuestions.maxOptions'),
        description: t('testQuestions.maxOptionsDescription'),
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    if (currentQuestion < 39) {
      // Regular questions validation
      if (!selectedFirst || !selectedSecond) {
        toast({
          title: t('testQuestions.selectTwo'),
          description: t('testQuestions.selectTwo'),
          variant: "destructive",
        });
        return;
      }

      // Save current answer
      const updatedAnswers = {
        ...answers,
        [currentQuestion]: {
          first: selectedFirst,
          second: selectedSecond
        }
      };
      setAnswers(updatedAnswers);

      // Reset selections
      setSelectedFirst('');
      setSelectedSecond('');

      // Move to next question
      setCurrentQuestion(prev => prev + 1);
      
      // Auto-save progress
      await saveProgress(true);

    } else if (currentQuestion === 39) {
      // Motivational selection validation
      if (motivationalButtons.length !== 5) {
        toast({
          title: t('testQuestions.selectFive'),
          description: t('testQuestions.selectFive'),
          variant: "destructive",
        });
        return;
      }

      // Complete the test
      await handleTestCompletion();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      
      // Load previous answers if they exist
      const prevAnswer = answers[currentQuestion - 1];
      if (prevAnswer) {
        setSelectedFirst(prevAnswer.first);
        setSelectedSecond(prevAnswer.second);
      }
    }
  };

  const handleTestCompletion = async () => {
    try {
      setLoading(true);
      
      const completionData = {
        sessionId,
        answers,
        motivationalSelection: motivationalButtons
      };

      const result = await ApiService.completeTest(testId!, completionData);
      
      // Clear session data
      localStorage.removeItem('currentTestSession');
      // Save user info for results page (robust)
      const sessionData = localStorage.getItem('currentTestSession');
      if (sessionData) {
        const { userInfo } = JSON.parse(sessionData);
        if (userInfo) {
          localStorage.setItem('testUserData', JSON.stringify(userInfo));
        }
      }
      // Navigate to results with result data
      localStorage.setItem('lastResultId', result.resultId);
      navigate(`/test/${testId}/results`, { 
        state: { 
          resultId: result.resultId,
          results: result.results,
          pdfStatus: result.pdfStatus
        } 
      });
      
    } catch (error) {
      console.error('Failed to complete test:', error);
      toast({
        title: t('testQuestions.completionError'),
        description: t('testQuestions.completionErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExitTest = () => {
    setShowExitDialog(true);
  };

  const confirmExit = async () => {
    await saveProgress(true);
    toast({
      title: t('testQuestions.progressSaved'),
      description: t('testQuestions.progressSavedDescription'),
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('testQuestions.loadingTest')}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">{t('testQuestions.testNotFound')}</h2>
            <p className="text-slate-600 mb-4">{t('testQuestions.testNotFoundDescription')}</p>
            <Button onClick={() => navigate('/')}>
              {t('testQuestions.returnHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = 40;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const isMotivationalQuestion = currentQuestion === 39;
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with progress and controls */}
        <div className="mb-8 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">
                {t('testQuestions.questionOf', { current: currentQuestion + 1, total: totalQuestions })}
              </span>
              {saving && <Save className="w-4 h-4 text-blue-500 animate-pulse" />}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveProgress(true)}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-1" />
                {t('testQuestions.save')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitTest}
              >
                {t('testQuestions.exit')}
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="h-3 bg-slate-200" />
          <div className="flex justify-between text-sm text-slate-600 mt-2">
            <span>{t('testQuestions.completed', { percent: Math.round(progress) })}</span>
            <span>
              {currentQ?.isRepeat && t('testQuestions.controlQuestion')}
              {isMotivationalQuestion && t('testQuestions.finalChoice')}
            </span>
          </div>
        </div>

        {/* Question Content */}
        <Card className="shadow-xl border-0 mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
              {translateQuestionText(currentQ?.text || '')}
            </h2>

            {!isMotivationalQuestion ? (
              // Regular Questions
              <>
                {/* First Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">
                    {t('testQuestions.selectFirst')}
                  </h3>
                  <div className="space-y-3">
                    {currentQ?.options.map((option) => {
                      const isSelected = selectedFirst === option.id;
                      const isDisabled = selectedFirst && !isSelected;
                      
                      return (
                        <Button
                          key={option.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`w-full p-4 h-auto text-left justify-start transition-all ${
                            isSelected
                              ? 'bg-blue-900 text-white border-blue-900'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'hover:bg-blue-50 hover:border-blue-300'
                          }`}
                          onClick={() => handleFirstSelection(option.id)}
                          disabled={isDisabled}
                        >
                          <div className="flex items-center space-x-3">
                            {isSelected && (
                              <CheckCircle className="w-5 h-5" />
                            )}
                            <span>{translateOptionText(option.text)}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Second Selection */}
                {selectedFirst && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                      {t('testQuestions.selectSecond')}
                    </h3>
                    <div className="space-y-3">
                      {currentQ?.options
                        .filter(option => option.id !== selectedFirst)
                        .map((option) => {
                          const isSelected = selectedSecond === option.id;
                          const isDisabled = selectedSecond && !isSelected;
                          
                          return (
                            <Button
                              key={option.id}
                              variant={isSelected ? "default" : "outline"}
                              className={`w-full p-4 h-auto text-left justify-start transition-all ${
                                isSelected
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : isDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'hover:bg-rose-50 hover:border-rose-300'
                              }`}
                              onClick={() => handleSecondSelection(option.id)}
                              disabled={isDisabled}
                            >
                              <div className="flex items-center space-x-3">
                                {isSelected && (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                                <span>{translateOptionText(option.text)}</span>
                              </div>
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Motivational Selection Question
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                  {currentQ?.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                      <Checkbox
                        id={option.id}
                        checked={motivationalButtons.includes(option.id)}
                        onCheckedChange={() => handleMotivationalSelection(option.id)}
                        disabled={!motivationalButtons.includes(option.id) && motivationalButtons.length >= 5}
                      />
                      <label 
                        htmlFor={option.id} 
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {translateMotivationalFactor(option.text)}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    {t('testQuestions.selected', { count: motivationalButtons.length })}
                  </p>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                className="px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('testQuestions.previous')}
              </Button>

              <Button
                onClick={handleNext}
                disabled={
                  (!isMotivationalQuestion && (!selectedFirst || !selectedSecond)) ||
                  (isMotivationalQuestion && motivationalButtons.length !== 5)
                }
                className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white px-6"
              >
                {currentQuestion === 39 ? t('testQuestions.completeTest') : t('testQuestions.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('testQuestions.exitDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('testQuestions.exitDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('testQuestions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>
              {t('testQuestions.saveAndExit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast container */}
      <Toaster />
    </div>
  );
};

export default TestQuestions;