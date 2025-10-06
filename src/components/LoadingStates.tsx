import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  message = 'Loading...'
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" className="text-blue-600 mb-4" />
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
};

interface InlineLoaderProps {
  message?: string;
  className?: string;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <LoadingSpinner className="text-blue-600 mr-3" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};

interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export const TableLoading: React.FC<TableLoadingProps> = ({
  rows = 5,
  columns = 6
}) => {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface CardLoadingProps {
  count?: number;
  className?: string;
}

export const CardLoading: React.FC<CardLoadingProps> = ({
  count = 3,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-100 rounded"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            <div className="h-3 bg-gray-100 rounded w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface ButtonLoadingProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const ButtonWithLoading: React.FC<ButtonLoadingProps> = ({
  children,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{children}</span>
    </button>
  );
};

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};
