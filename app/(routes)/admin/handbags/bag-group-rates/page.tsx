'use client';

import React from 'react';

import dynamic from 'next/dynamic';

import {BagGroupRateProvider} from '@/hooks/group/bag-group-rate/BagGroupRateContext';
import {HandBagProvider} from '@/hooks/handbag/HandBagContext';

Use dynamic import with ssr:false to avoid SSR context issues
const DynamicBagGroupRateContainer = dynamic(
  () => import('@/screens/admin/bag-group-rate/Container'),
  {ssr: false},
);

/**
 * Main page component that ensures BagGroupRateProvider is properly initialized
 * Using dynamic import ensures the components only load on the client
 */
export default function BagGroupRatePage() {
  return (
    <HandBagProvider>
      <BagGroupRateProvider>
        <DynamicBagGroupRateContainer />
      </BagGroupRateProvider>
    </HandBagProvider>
  );
}
