import React from 'react';
import { Bus } from 'lucide-react';

interface GlobalLoaderProps {
  isLoading: boolean;
  message?: string;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm transition-opacity">
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-red-700 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-red-700">
             <Bus size={24} />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 animate-pulse">{message}</h3>
      </div>
    </div>
  );
};