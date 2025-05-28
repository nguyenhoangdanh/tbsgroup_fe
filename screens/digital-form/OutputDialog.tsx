'use client';

import { useState, useEffect } from 'react';

import { TIME_SLOTS } from '@/common/constants/time-slots';
import { Worker } from '@/common/types/worker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface OutputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
  timeSlot: string | null;
  onUpdate: (quantity: number) => void;
}

export default function OutputDialog({
  open,
  onOpenChange,
  worker,
  timeSlot,
  onUpdate,
}: OutputDialogProps) {
  const [quantity, setQuantity] = useState<number>(0);

  // Update quantity when worker or timeSlot changes
  useEffect(() => {
    if (worker && timeSlot) {
      setQuantity(worker.hourlyData[timeSlot] || 0);
    } else {
      setQuantity(0);
    }
  }, [worker, timeSlot]);

  // Handle quantity update
  const handleUpdate = () => {
    onUpdate(quantity);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật sản lượng - {worker?.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Khung giờ</label>
            <div className="relative">
              <select
                className="w-full p-2 border rounded-md bg-gray-50"
                value={timeSlot || ''}
                disabled
              >
                <option>Chọn khung giờ</option>
                {TIME_SLOTS.map(slot => (
                  <option key={slot.id} value={slot.label}>
                    {slot.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L6 6L11 1"
                    stroke="#6B7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số lượng</label>
            <Input
              type="number"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleUpdate} className="w-full">
            Cập nhật sản lượng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
