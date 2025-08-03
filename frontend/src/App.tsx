// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '@/context/LanguageContext';
import LanguageSwitch from '@/components/common/LanguageSwitch';

// Existing Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import TestLanding from '@/pages/TestLanding';
import TestQuestions from '@/pages/TestQuestions';
import TestResults from '@/pages/TestResults';
import NotFound from '@/pages/NotFound';

// New Admin Pages
import AdminDashboard from '@/pages/AdminDashboard';
import CoachActivation from '@/pages/CoachActivation';

// Admin Components
import AdminRoute from '@/components/guards/AdminRoute';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

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
            <div style={{ marginTop: '1rem' }}>
                <h3>Available Routes:</h3>
                <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                    <li><a href="/" style={{ color: '#1e40af' }}>/ - Home</a></li>
                    <li><a href="/login" style={{ color: '#1e40af' }}>/login - Coach Login</a></li>
                    <li><a href="/admin/login" style={{ color: '#1e40af' }}>/admin/login - Admin Login</a></li>
                    <li><a href="/admin" style={{ color: '#1e40af' }}>/admin - Admin Dashboard</a></li>
                    <li><a href="/activate" style={{ color: '#1e40af' }}>/activate - Coach Activation</a></li>
                </ul>
            </div>
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

    return (
        <LanguageProvider>
            <Router>
                <div className="App">
                    {/* Global Language Switch Button */}
                    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
                        <LanguageSwitch />
                    </div>
                    <Routes>
                        {/* Test route */}
                        <Route path="/test" element={<SimpleTest />} />

                        {/* Public Routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* Admin Login Route (Public) */}
                        <Route path="/admin/login" element={<AdminLoginForm />} />

                        {/* Protected Admin Routes */}
                        <Route path="/admin" element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        } />
                        <Route path="/admin/dashboard" element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        } />

                        {/* Coach Activation Routes (Public) */}
                        <Route path="/activate" element={<CoachActivation />} />
                        <Route path="/activate/:token" element={<CoachActivation />} />
                        <Route path="/coach/activate" element={<CoachActivation />} />
                        <Route path="/coach/activate/:token" element={<CoachActivation />} />

                        {/* Test Taking Routes */}
                        <Route path="/test/:testId" element={<TestLanding />} />
                        <Route path="/test/:testId/questions" element={<TestQuestions />} />
                        <Route path="/test/:testId/results" element={<TestResults />} />

                        {/* Catch all route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>
            </Router>
        </LanguageProvider>
    );
};

export default App;