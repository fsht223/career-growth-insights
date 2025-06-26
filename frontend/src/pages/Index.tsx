import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const Index = () => {
  const { t } = useTranslation();
  console.log('Index component rendered');

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f9ff', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#1e40af', marginBottom: '1rem' }}>{t('index.title')}</h1>
        <p style={{ color: '#6b7280' }}>{t('index.text')}</p>
        <p style={{ color: '#6b7280', marginTop: '1rem' }}>{t('index.routing')}</p>
      </div>
    </div>
  );
};

export default Index;
