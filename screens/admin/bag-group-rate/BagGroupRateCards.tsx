'use client';

import { Eye, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { BagGroupRateContextBridge } from './BagGroupRateContextBridge';

import { HandBagWithStats } from '@/apis/group/bagGroupRate/bag-group-rate.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface BagGroupRateCardsProps {
  handBags: HandBagWithStats[];
  loading?: boolean;
}

const BagGroupRateCards: React.FC<BagGroupRateCardsProps> = ({
  handBags = [],
  loading = false,
}) => {
  return (
    <BagGroupRateContextBridge>
      <BagGroupRateCardsContent handBags={handBags} loading={loading} />
    </BagGroupRateContextBridge>
  );
};

const BagGroupRateCardsContent: React.FC<BagGroupRateCardsProps> = ({ handBags, loading }) => {
  const router = useRouter();

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!handBags || handBags.length === 0) {
    return <div>Không có dữ liệu</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {handBags.map(handBag => (
        <Card key={handBag.id} className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="font-bold">{handBag.code}</span>
              <span className="text-sm bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 py-1 px-2 rounded-full">
                {handBag.totalGroups} nhóm
              </span>
            </CardTitle>
            <div className="text-sm">{handBag.name}</div>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Trung bình</div>
                <div className="font-bold">{handBag.averageOutputRate.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">SP/giờ</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cao nhất</div>
                <div className="font-bold text-green-600">
                  {handBag.highestOutputRate.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">SP/giờ</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Thấp nhất</div>
                <div className="font-bold text-red-500">{handBag.lowestOutputRate.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">SP/giờ</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/handbags/bag-group-rates/hand-bags/${handBag.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" /> Chi tiết
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/handbags/bag-group-rates/analysis/${handBag.id}`)}
            >
              <BarChart className="h-4 w-4 mr-1" /> Phân tích
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default BagGroupRateCards;
