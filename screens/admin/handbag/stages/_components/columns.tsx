'use client';
import { ColumnDef } from '@tanstack/react-table';

import ButtonGroupAction from '@/components/common/table/actions/button-group-actions';
import { Checkbox } from '@/components/ui/checkbox';

export type HandbagProductionProcess = {
  id: string;
  code: string;
  name: string;
};

export const columns: ColumnDef<HandbagProductionProcess>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'code',
    header: 'Mã công đoạn',
    cell: ({ row }) => <div className="capitalize">{row.getValue('code')}</div>,
  },
  {
    accessorKey: 'name',
    header: 'Tên công đoạn',
    cell: ({ row }) => <div className="capitalize">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <ButtonGroupAction
          onEdit={() => console.log('update', id)}
          onDelete={() => deleteProductionProcess(Number(id))}
        />
      );
    },
  },
];
