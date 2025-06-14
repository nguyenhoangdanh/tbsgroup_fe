import { UserCircle } from 'lucide-react';

import { Worker } from '@/common/types/worker';
import { CardHeader, CardTitle } from '@/components/ui/card';

import { ShiftTypeBadge } from './shift-type-badge';
import { WorkerStatusBadge } from './worker-status-badge';


interface WorkerHeaderProps {
  worker: Worker;
}

export function WorkerHeader({ worker }: WorkerHeaderProps) {
  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">{worker.user?.fullName || worker.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {worker.user?.employeeId || worker.employeeId || 'Không có mã'}
            </p>
          </div>
        </div>
        <div className="flex flex-row gap-1">
          <ShiftTypeBadge type={worker.shiftType} />
          <WorkerStatusBadge status={worker.attendanceStatus} />
        </div>
      </div>
    </CardHeader>
  );
}
