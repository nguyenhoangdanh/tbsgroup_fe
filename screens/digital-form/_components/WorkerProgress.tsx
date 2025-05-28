import { Info } from 'lucide-react';

import { Progress } from '@/components/ui/progress';

interface WorkerProgressProps {
  completedSlots: number;
  totalSlots: number;
  percentage: number;
  totalOutput: number;
  bagsList?: Array<{
    id: string;
    bagName: string;
    totalOutput: number;
  }>;
}

export function WorkerProgress({
  completedSlots,
  totalSlots,
  percentage,
  totalOutput,
  bagsList = [],
}: WorkerProgressProps) {
  const showMultipleBags = bagsList.length > 1;

  return (
    <div className="space-y-4 mb-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium">Tiến độ nhập liệu</p>
          <span className="text-sm">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between mt-2 text-xs">
          <span>
            Đã nhập: {completedSlots}/{totalSlots}
          </span>
          <span>Tổng sản lượng: {totalOutput}</span>
        </div>
      </div>

      {/* Multiple bag summary if more than one bag exists */}
      {showMultipleBags && (
        <div className="bg-blue-50 rounded-md p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-blue-700">
              Công nhân làm {bagsList.length} loại túi
            </div>
            <div className="text-xs mt-1">
              Tổng sản lượng: <span className="font-medium">{totalOutput}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
              {bagsList.map(bag => (
                <div key={bag.id} className="text-xs flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mr-1"></span>
                  {bag.bagName}: <span className="font-medium ml-1">{bag.totalOutput}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
