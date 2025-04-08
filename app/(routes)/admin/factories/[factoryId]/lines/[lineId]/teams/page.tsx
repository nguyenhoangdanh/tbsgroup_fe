"use client";

import React from 'react';
import { TeamProvider } from '@/hooks/teams/TeamContext';
import TeamsContainer from '@/screens/admin/teams/Container';
import { LineProvider } from '@/hooks/line/LineContext';

interface LinesPageProps {
    params: {
        lineId: string;
    };
}

const TeamsPage: React.FC<LinesPageProps> = ({ params }) => {
    return (
        <LineProvider>
            <TeamProvider>
                <div className="container mx-auto py-6">
                    <TeamsContainer params={params} />
                </div>
            </TeamProvider>
        </LineProvider>
    );
};

export default TeamsPage;