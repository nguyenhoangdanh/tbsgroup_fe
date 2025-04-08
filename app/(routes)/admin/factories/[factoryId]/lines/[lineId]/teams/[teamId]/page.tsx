"use client";

import React from 'react';
import { TeamProvider } from '@/hooks/teams/TeamContext';
import TeamDetails from '@/screens/admin/teams/TeamDetails';
import { LineProvider } from '@/hooks/line/LineContext';

interface LinesPageProps {
    params: {
        teamId: string;
    };
}

const TeamDetailsPage: React.FC<LinesPageProps> = ({ params }) => {
    return (
        <LineProvider>
            <TeamProvider>
                <div className="container mx-auto py-6">
                    <TeamDetails params={params} />
                </div>
            </TeamProvider>
        </LineProvider>
    );
};

export default TeamDetailsPage;