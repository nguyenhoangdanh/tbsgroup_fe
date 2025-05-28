'use client';

import React from 'react';

import { FactoryProvider } from '@/hooks/factory/FactoryContext';
import FactoryManagementScreen from '@/screens/admin/factory/Container';

const FactoryPage = () => {
  return (
    <FactoryProvider>
      <FactoryManagementScreen />
    </FactoryProvider>
  );
};

export default FactoryPage;
