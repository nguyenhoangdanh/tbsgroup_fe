'use client';

import React from 'react';

import { BagGroupRateContextBridge } from './BagGroupRateContextBridge';
import HandBagsList from './HandBagsList';

import { Tabs, TabsContent } from '@/components/ui/tabs';

const HandBagGroups = () => {
  return (
    <BagGroupRateContextBridge>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-4">
          {/* <div className="w-full mb-4">
                        <BagGroupRateStats />
                    </div> */}

          <Tabs defaultValue="list" className="w-full">
            {/* <TabsList className="mb-4">
                            <TabsTrigger value="list">Danh sách túi xách</TabsTrigger>
                        </TabsList> */}

            <TabsContent value="list" className="space-y-4">
              <HandBagsList />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </BagGroupRateContextBridge>
  );
};

export default HandBagGroups;
