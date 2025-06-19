import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Loading = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClass = clsx(
    'flex items-center justify-center',
    fullScreen && 'min-h-screen'
  );

  return (
    <div className={containerClass}>
      <Loader2 className={clsx('animate-spin text-primary-600', sizes[size])} />
    </div>
  );
};

export default Loading;