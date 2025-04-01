"use client";

import React from 'react';
import { FactoryProvider } from '@/hooks/factory/FactoryContext';
import { FactoryDetails } from '@/screens/admin/factory/FactoryDetails';
import { LineProvider } from '@/hooks/line/LineContext';

interface FactoryDetailsPageProps {
    params: {
        factoryId: string;
    };
}

const FactoryDetailsPage: React.FC<FactoryDetailsPageProps> = ({ params }) => {
    return (
        <FactoryProvider>
            <LineProvider>
                <div className="container mx-auto py-6">
                    <FactoryDetails factoryId={params.factoryId} />
                </div>
            </LineProvider>
        </FactoryProvider>
    );
};

export default FactoryDetailsPage;