'use client';

import React from 'react';

import { Card, CardContent, CardFooter, CardHeader } from './card';

import { cn } from '@/lib/utils';

interface ShimmerLoaderProps {
  height?: string;
  width?: string;
  className?: string;
  rounded?: boolean;
}

export function ShimmerCard({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="p-4 pb-0">
        <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
          <div className="h-3 w-5/6 bg-gray-200 animate-pulse rounded" />
          <div className="h-3 w-4/6 bg-gray-200 animate-pulse rounded" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="h-8 w-full bg-gray-200 animate-pulse rounded" />
      </CardFooter>
    </Card>
  );
}

export function TimeSlotSkeletonLoader() {
  return (
    <div className="bg-background shadow rounded-md p-3 my-2">
      <div className="h-6 w-4/5 bg-gray-200 animate-pulse rounded mb-2" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-9 bg-gray-200 animate-pulse rounded" />
        <div className="h-9 bg-gray-200 animate-pulse rounded" />
        <div className="h-9 bg-gray-200 animate-pulse rounded" />
        <div className="h-9 bg-gray-200 animate-pulse rounded" />
      </div>
    </div>
  );
}

export function BagTimeSlotSkeletonLoader() {
  return (
    <div className="space-y-4">
      <TimeSlotSkeletonLoader />
      <TimeSlotSkeletonLoader />
      <TimeSlotSkeletonLoader />
    </div>
  );
}

const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  height = '20px',
  width = '100%',
  className = '',
  rounded = true,
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%]',
        rounded && 'rounded',
        className,
      )}
      style={{ height, width }}
    />
  );
};

export default ShimmerLoader;
