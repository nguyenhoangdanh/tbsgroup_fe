'use client';

import HandBagOverview from '@/screens/admin/bag-group-rate/HandBagOverview';

export default function HandBagsOverviewPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý túi xách và năng suất nhóm</h1>
      <HandBagOverview />
    </div>
  );
}
