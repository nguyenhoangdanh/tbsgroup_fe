"use client";

import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import WorkLogContainer from '@/screens/public/form/WorkLogContainer';

// Loading component
const Loading = () => (
    <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-12 w-80 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="pt-4 flex justify-between">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const TimeSheetPage = () => {
    return (
        <Suspense fallback={<Loading />}>
            {/* <TimeSheetContainer /> */}
            <WorkLogContainer />
        </Suspense>
    );
};

export default TimeSheetPage;