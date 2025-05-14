// components/TimeSlotTable.tsx
import { Edit } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BagInTimeSlot {
  entryId: string;
  bagId: string;
  bagName: string;
  processId: string;
  processName: string;
  colorId: string;
  colorName: string;
  output: number;
}

interface TimeSlotData {
  label: string;
  output: number;
  status: 'completed' | 'current' | 'missing' | 'pending';
}

interface TimeSlotTableProps {
  timeSlotData: TimeSlotData[];
  totalOutput: number;
  getBagsForTimeSlot: (timeSlot: string) => BagInTimeSlot[];
  onEditTimeSlot: (timeSlot: string) => void;
}

export function TimeSlotTable({
  timeSlotData,
  totalOutput,
  getBagsForTimeSlot,
  onEditTimeSlot,
}: TimeSlotTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[110px] py-2 text-xs">Khung giờ</TableHead>
            <TableHead className="py-2 text-xs">Túi</TableHead>
            <TableHead className="w-[70px] text-right py-2 text-xs">Sản lượng</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeSlotData.map(slot => {
            // Get bags for this time slot
            const bagsInSlot = getBagsForTimeSlot(slot.label);
            const hasBags = bagsInSlot.some(b => b.output > 0);
            const bagCount = bagsInSlot.filter(b => b.output > 0).length;

            return (
              <TableRow key={slot.label} className={slot.status === 'current' ? 'bg-blue-50' : ''}>
                <TableCell className="py-2 text-xs">
                  <div className="flex items-center gap-1">
                    {slot.status === 'completed' && (
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    )}
                    {slot.status === 'current' && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    )}
                    {slot.status === 'missing' && (
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    )}
                    {slot.status === 'pending' && (
                      <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    )}
                    {slot.label}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-xs">
                  {hasBags ? (
                    bagCount > 1 ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{bagCount} túi</span>
                        <Badge variant="outline" className="text-xs">
                          Nhiều túi
                        </Badge>
                      </div>
                    ) : (
                      bagsInSlot.find(b => b.output > 0)?.bagName || '—'
                    )
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="py-2 text-xs font-medium text-right">
                  {slot.output || '—'}
                </TableCell>
                <TableCell className="py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onEditTimeSlot(slot.label)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/30">
            <TableCell colSpan={2} className="py-2 text-xs font-medium text-right">
              Tổng sản lượng:
            </TableCell>
            <TableCell colSpan={2} className="py-2 text-xs font-medium text-right">
              {totalOutput}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
