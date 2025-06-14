'use client';

import React from 'react';

import { LineProvider } from '@/hooks/line/LineContext';
import { TeamProvider } from '@/hooks/teams/TeamContext';
import { LineDetails } from '@/screens/admin/lines/LineDetails';

interface LineDetailsPageProps {
  params: {
    factoryId: string;
    lineId: string;
  };
}

const LineDetailsPage: React.FC<LineDetailsPageProps> = ({ params }) => {
  return (
    <LineProvider>
      <TeamProvider>
        <div className="container mx-auto py-6">
          <LineDetails factoryId={params.factoryId} lineId={params.lineId} />
        </div>
      </TeamProvider>
    </LineProvider>
  );
};

export default LineDetailsPage;
