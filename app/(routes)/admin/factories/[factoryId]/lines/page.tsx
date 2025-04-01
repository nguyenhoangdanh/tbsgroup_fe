"use client";

import React from 'react';
import { LineProvider } from '@/hooks/line/LineContext';
import LinesListContainer from '@/screens/admin/lines/Container';

interface LinesPageProps {
    params: {
        factoryId: string;
    };
}

const LinesPage: React.FC<LinesPageProps> = ({ params }) => {
    return (
        <LineProvider>
            <div className="container mx-auto py-6">
                <LinesListContainer params={params} />
            </div>
        </LineProvider>
    );
};

export default LinesPage;