'use client';
import { Edit, Clock, Package } from 'lucide-react';
import React from 'react';

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
import { cn } from '@/lib/utils';

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
  // Show the table in desktop view, and cards in mobile view
  return (
    <div>
      {/* Desktop view - Table format */}
      <div className="hidden md:block">
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
                  <TableRow
                    key={slot.label}
                    className={slot.status === 'current' ? 'bg-blue-50/60' : ''}
                  >
                    <TableCell className="py-2 text-xs">
                      <div className="flex items-center gap-1">
                        <StatusDot status={slot.status} />
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
      </div>

      {/* Mobile view - Card format */}
      <div className="md:hidden space-y-2">
        {timeSlotData.map(slot => {
          const bagsInSlot = getBagsForTimeSlot(slot.label);
          const hasBags = bagsInSlot.some(b => b.output > 0);
          const bagCount = bagsInSlot.filter(b => b.output > 0).length;

          return (
            <div
              key={slot.label}
              className={cn(
                'border rounded-md p-2 relative',
                slot.status === 'current' ? 'bg-blue-50/60 border-blue-200' : '',
                slot.status === 'completed' ? 'bg-green-50/30' : '',
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1">
                  <StatusDot status={slot.status} />
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-xs font-medium">{slot.label}</span>
                    </div>
                    <div className="mt-1 flex items-center">
                      <Package className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {hasBags ? (
                          bagCount > 1 ? (
                            <div className="flex items-center gap-1">
                              <span>{bagCount} túi</span>
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                Nhiều túi
                              </Badge>
                            </div>
                          ) : (
                            <span className="truncate max-w-[150px] inline-block">
                              {bagsInSlot.find(b => b.output > 0)?.bagName || '—'}
                            </span>
                          )
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-right">
                    <span className="text-xs font-medium">{slot.output || '—'}</span>
                  </div>
                  <div className="mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onEditTimeSlot(slot.label)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Total row */}
        <div className="border rounded-md p-2 bg-muted/20 flex justify-between items-center">
          <span className="text-xs font-medium">Tổng sản lượng:</span>
          <span className="text-xs font-medium">{totalOutput}</span>
        </div>
      </div>
    </div>
  );
}

// Helper component for status indicators
const StatusDot: React.FC<{ status: 'completed' | 'current' | 'missing' | 'pending' }> = ({
  status,
}) => {
  return (
    <>
      {status === 'completed' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
      {status === 'current' && (
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
      )}
      {status === 'missing' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
      {status === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-300"></span>}
    </>
  );
};
