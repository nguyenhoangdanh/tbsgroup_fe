import React from 'react';

import { BagColorProvider } from '@/hooks/handbag/bag-color/BagColorContext';
import { HandBagProvider } from '@/hooks/handbag/HandBagContext';
import BagColorManagementScreen from '@/screens/admin/handbag/bag-color/Container';

export default function BagColorPage() {
  return (
    <HandBagProvider>
      <BagColorProvider>
        <BagColorManagementScreen />
      </BagColorProvider>
    </HandBagProvider>
  );
}
