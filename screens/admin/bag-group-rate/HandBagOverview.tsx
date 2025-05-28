'use client';

import React, { useEffect, useState } from 'react';

import BagGroupRateCards from './BagGroupRateCards';
import { BagGroupRateContextBridge } from './BagGroupRateContextBridge';
import HandBagsList from './HandBagsList';

import { HandBagWithStats } from '@/apis/group/bagGroupRate/bag-group-rate.api';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';

const HandBagOverview = () => {
  return (
    <BagGroupRateContextBridge>
      <HandBagOverviewContent />
    </BagGroupRateContextBridge>
  );
};

const HandBagOverviewContent = () => {
  const { getAllHandBagsWithStats } = useBagGroupRateContext();
  const [handBags, setHandBags] = useState<HandBagWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getAllHandBagsWithStats();
        if (result && result.handBags) {
          setHandBags(result.handBags);
        }
      } catch (error) {
        console.error('Error fetching hand bags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getAllHandBagsWithStats]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Dạng bảng</TabsTrigger>
          <TabsTrigger value="cards">Dạng thẻ</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <HandBagsList handBags={handBags} isLoading={false} />
        </TabsContent>

        <TabsContent value="cards">
          <BagGroupRateCards handBags={handBags} loading={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HandBagOverview;
