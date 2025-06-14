'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

import { LoadingConfig } from './LoadingProvider';


interface TableSkeletonLoaderProps {
  config: LoadingConfig;
  onExitComplete: () => void;
}

const TableSkeletonLoader: React.FC<TableSkeletonLoaderProps> = ({ config, onExitComplete }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');

  const columns = config.skeletonConfig?.columns || (isMobile ? 3 : isTablet ? 4 : 5);
  const rows = config.skeletonConfig?.rows || (isMobile ? 4 : isTablet ? 5 : 6);

  const getWidthClass = (rowIndex: number, colIndex: number) => {
    const options = ['w-16', 'w-24', 'w-32', 'w-40', 'w-full'];
    return options[(rowIndex + colIndex) % options.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full ${config.customClass || ''}`}
      onAnimationComplete={definition => {
        if (definition === 'exit') onExitComplete();
      }}
    >
      <div className="overflow-x-auto border rounded-md bg-white dark:bg-gray-900">
        <div className="bg-gray-50 dark:bg-gray-800 border-b">
          <div className="flex">
            {Array.from({ length: columns }).map((_, index) => (
              <div key={`header-${index}`} className="px-4 py-3 flex-1">
                <div className={`h-6 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse`} />
              </div>
            ))}
          </div>
        </div>
        <div>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex border-b last:border-0">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={`cell-${rowIndex}-${colIndex}`} className="px-4 py-3 flex-1">
                  <div
                    className={`h-5 bg-gray-200 dark:bg-gray-700 rounded ${getWidthClass(rowIndex, colIndex)} animate-pulse`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TableSkeletonLoader;
