"use client";

import React from 'react';
import { LineProvider } from '@/hooks/line/LineContext';
import { LineSettings } from '@/screens/admin/lines/LineSettings';

interface LineDetailsPageProps {
    params: {
        factoryId: string;
        lineId: string;
    };
}

const LineSettingsByIdPage: React.FC<LineDetailsPageProps> = ({ params }) => {
    return (
        <LineProvider>
            <div className="container mx-auto py-6">
                <LineSettings
                    factoryId={params.factoryId}
                    lineId={params.lineId}
                />
            </div>
        </LineProvider>
    );
};

export default LineSettingsByIdPage;
