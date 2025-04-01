"use client";

import React from 'react';
import { LineProvider } from '@/hooks/line/LineContext';
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
            <div className="container mx-auto py-6">
                <LineDetails
                    factoryId={params.factoryId}
                    lineId={params.lineId}
                />
            </div>
        </LineProvider>
    );
};

export default LineDetailsPage;