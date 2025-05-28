import { LineChart } from 'lucide-react';

interface TimeSlotData {
  label: string;
  output: number;
  status: 'completed' | 'current' | 'missing' | 'pending';
}

interface ProductionChartProps {
  timeSlotData: TimeSlotData[];
}
export function ProductionChart({ timeSlotData }: ProductionChartProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted/50 p-2 text-xs font-medium flex items-center">
        <LineChart className="h-3.5 w-3.5 mr-1.5" />
        Chi tiết sản lượng theo giờ
      </div>
      <div className="p-4">
        <div className="h-48 relative">
          {timeSlotData.map((slot, index) => {
            const maxOutput = Math.max(...timeSlotData.map(s => s.output)) || 1;
            const barHeight = (slot.output / maxOutput) * 100;

            return (
              <div
                key={slot.label}
                className="flex flex-col items-center absolute bottom-0"
                style={{
                  left: `${(index / (timeSlotData.length - 1)) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-xs mb-1">{slot.output || 0}</div>
                <div
                  className={`w-8 ${slot.status === 'current' ? 'bg-blue-500' : 'bg-primary'} rounded-t`}
                  style={{
                    height: `${barHeight}%`,
                    minHeight: slot.output > 0 ? '10%' : '0',
                  }}
                ></div>
                <div className="text-xs mt-1">{slot.label.split('-')[0]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
