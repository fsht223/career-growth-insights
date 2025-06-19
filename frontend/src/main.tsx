// src/main.tsx
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Starting React application...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

try {
  root.render(<App />);
  console.log('React application rendered successfully');
} catch (error) {
  console.error('Failed to render React application:', error);
}