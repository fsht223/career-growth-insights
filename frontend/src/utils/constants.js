export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ROUTES = {
  HOME: '/',
  REGISTER: '/register',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TEST: '/test/:testId',
};

export const PROFESSIONS = [
  'C Level',
  'Маркетинг',
  'Продажи',
  'HR',
  'IT',
  'Финансы',
  'Операции',
  'Консалтинг',
  'Образование',
];

export const LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'kz', label: 'Казахский' },
  { value: 'en', label: 'English' },
];

export const REPORT_RECIPIENTS = {
  COACH: 'coach',
  TESTEE: 'testee',
  BOTH: 'both',
};