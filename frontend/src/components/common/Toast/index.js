import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import clsx from 'clsx';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

const Toast = ({ message, type = 'info' }) => {
  const Icon = icons[type];
  const color = colors[type];

  return (
    <div
      className={clsx(
        'flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg text-white animate-slide-in',
        color
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
};

export default Toast;