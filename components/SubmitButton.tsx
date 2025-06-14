'use client';
import { Loader } from 'lucide-react';
import React from 'react';

import { Button } from './ui/button';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  name: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = React.memo(
  ({ isLoading = false, name, disabled, ...props }: SubmitButtonProps) => {
    return (
      <Button
        disabled={disabled}
        type="submit"
        className={`w-full font-bold py-3 rounded-lg text-white ${
          disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 active:bg-green-900'
        } transition-all duration-300 ease-in-out`}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          name
        )}
      </Button>
    );
  }
);

SubmitButton.displayName = 'SubmitButton';
export default SubmitButton;
