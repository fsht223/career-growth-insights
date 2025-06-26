import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

const LanguageSwitch: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} style={{ minWidth: 80 }}>
      {language === 'ru' ? 'Русский' : 'English'}
    </Button>
  );
};

export default LanguageSwitch; 