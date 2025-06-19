// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import TestLanding from '@/pages/TestLanding';
import TestQuestions from '@/pages/TestQuestions';
import TestResults from '@/pages/TestResults';
import NotFound from '@/pages/NotFound';

// Simple test component
const SimpleTest: React.FC = () => (
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
      <h1 style={{ color: '#1e40af', marginBottom: '1rem' }}>React Router is Working!</h1>
      <p style={{ color: '#6b7280' }}>This is the test route at /test</p>
      <button 
        style={{ 
          backgroundColor: '#1e40af', 
          color: 'white', 
          border: 'none', 
          padding: '0.5rem 1rem', 
          borderRadius: '4px', 
          marginTop: '1rem',
          cursor: 'pointer'
        }}
        onClick={() => alert('Button clicked!')}
      >
        Test Button
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  console.log('App component rendered');
  
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Test route */}
          <Route path="/test" element={<SimpleTest />} />
          
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Test Taking Routes */}
          <Route path="/test/:testId" element={<TestLanding />} />
          <Route path="/test/:testId/questions" element={<TestQuestions />} />
          <Route path="/test/:testId/results" element={<TestResults />} />

          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;