import React from 'react';

const Index = () => {
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
        <h1 style={{ color: '#1e40af', marginBottom: '1rem' }}>Index Page Working!</h1>
        <p style={{ color: '#6b7280' }}>This is the Index page at /</p>
        <p style={{ color: '#6b7280', marginTop: '1rem' }}>If you can see this, the routing and page components are working.</p>
      </div>
    </div>
  );
};

export default Index;
