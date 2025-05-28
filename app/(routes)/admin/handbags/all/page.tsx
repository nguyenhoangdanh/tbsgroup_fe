'use client';

import React from 'react';

import { HandBagProvider } from '@/hooks/handbag/HandBagContext';
import HandBagManagementScreen from '@/screens/admin/handbag/Container';

const HandBagPage = () => {
  return (
    <HandBagProvider>
      <HandBagManagementScreen />
    </HandBagProvider>
  );
};

export default HandBagPage;
