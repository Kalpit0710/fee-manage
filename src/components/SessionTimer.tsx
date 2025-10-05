import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface SessionTimerProps {
  timeRemaining: number;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ timeRemaining }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const getTimerColor = () => {
    if (timeRemaining <= 300) return 'text-red-600 bg-red-50 border-red-200';
    if (timeRemaining <= 600) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getIcon = () => {
    if (timeRemaining <= 300) return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const formatTime = () => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${getTimerColor()}`}>
      {getIcon()}
      <div className="flex flex-col">
        <span className="text-xs font-medium">{formatTime()}</span>
        <span className="text-[10px] opacity-75">Session</span>
      </div>
    </div>
  );
};
