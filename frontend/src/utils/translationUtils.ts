// Translation utilities for dynamic content from backend
import { useTranslation } from '@/hooks/useTranslation';

// Mapping of backend motivational factor keys to translation keys
const motivationalFactorMapping: Record<string, string> = {
  'Intuition': 'motivationalFactors.intuition',
  'Success': 'motivationalFactors.success',
  'Professional Pleasure': 'motivationalFactors.professionalPleasure',
  'Bringing Happiness': 'motivationalFactors.bringingHappiness',
  'Perfectionism': 'motivationalFactors.perfectionism',
  'Social Contact': 'motivationalFactors.socialContact',
  'Empathy': 'motivationalFactors.empathy',
  'Recognition': 'motivationalFactors.recognition',
  'Resilience': 'motivationalFactors.resilience',
  'Respect': 'motivationalFactors.respect',
  'Value': 'motivationalFactors.value',
  'Intellectual Discovery': 'motivationalFactors.intellectualDiscovery',
  'Team Spirit': 'motivationalFactors.teamSpirit',
  'Influence': 'motivationalFactors.influence',
  'Responsibility': 'motivationalFactors.responsibility',
  'Reaching Goals': 'motivationalFactors.reachingGoals',
  'Being Logical': 'motivationalFactors.beingLogical',
  'Social Approval': 'motivationalFactors.socialApproval',
  'Efficiency': 'motivationalFactors.efficiency'
};

// Hook to translate motivational factors
export const useMotivationalFactorTranslation = () => {
  const { t } = useTranslation();
  
  const translateMotivationalFactor = (factor: string): string => {
    const translationKey = motivationalFactorMapping[factor];
    return translationKey ? t(translationKey) : factor;
  };

  return { translateMotivationalFactor };
};

// Hook to translate question text
export const useQuestionTranslation = () => {
  const { t } = useTranslation();
  
  const translateQuestionText = (text: string): string => {
    // Check if it's a standard question text
    if (text.includes('Какое из следующих утверждений лучше описывает вас?')) {
      if (text.includes('(повтор)')) {
        return t('testQuestions.repeatQuestionText');
      }
      return t('testQuestions.questionText');
    }
    
    // Check if it's the motivational selection question
    if (text.includes('Выберите 5 наиболее важных для вас мотивационных факторов')) {
      return t('testQuestions.motivationalSelectionText');
    }
    
    // Return original text if no translation found
    return text;
  };

  return { translateQuestionText };
};

// Utility function to translate any motivational factor (for use outside of components)
export const translateMotivationalFactor = (factor: string, t: (key: string) => string): string => {
  const translationKey = motivationalFactorMapping[factor];
  return translationKey ? t(translationKey) : factor;
};

// Utility to translate question option text
export const useOptionTextTranslation = () => {
  const { t } = useTranslation();
  const translateOptionText = (text: string): string => {
    return t(`questionOption.${text}`);
  };
  return { translateOptionText };
}; 