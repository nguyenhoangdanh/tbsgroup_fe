import { Package } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BagData {
  id: string;
  bagId: string;
  bagName: string;
  processId: string;
  processName: string;
  colorId: string;
  colorName: string;
  hourlyData: Record<string, number>;
  totalOutput: number;
}

interface BagsTableProps {
  bagsList: BagData[];
  selectedBagId: string;
  totalOutput: number;
}

export function BagsTable({ bagsList, selectedBagId, totalOutput }: BagsTableProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted/50 p-2 text-xs font-medium flex items-center">
        <Package className="h-3.5 w-3.5 mr-1.5" />
        Sản lượng theo túi
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs py-2">Loại túi</TableHead>
            <TableHead className="text-xs text-right py-2">Sản lượng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bagsList.map(bag => (
            <TableRow key={bag.id} className={bag.id === selectedBagId ? 'bg-blue-50' : ''}>
              <TableCell className="text-xs py-2">
                <div className="font-medium">{bag.bagName}</div>
                <div className="text-xs text-muted-foreground">
                  {bag.processName} - {bag.colorName}
                </div>
              </TableCell>
              <TableCell className="text-xs py-2 text-right font-medium">
                {bag.totalOutput}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/30">
            <TableCell className="text-xs py-2 font-medium">Tổng sản lượng</TableCell>
            <TableCell className="text-xs py-2 text-right font-medium">{totalOutput}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
