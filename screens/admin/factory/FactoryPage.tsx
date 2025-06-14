'use client';

import React from 'react';

import { FactoryProvider } from '@/hooks/factory/FactoryContext';

import FactoryContainer from './FactoryContainer';

const FactoryPage: React.FC = () => {
  return (
    <FactoryProvider
      config={{
        enableAutoRefresh: true,
        prefetchRelatedData: true,
        cacheStrategy: 'conservative',
      }}
    >
      <FactoryContainer />
    </FactoryProvider>
  );
};

// Export as default for main factory management
export default FactoryPage;
