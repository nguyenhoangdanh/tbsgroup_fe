'use client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Plus, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { DigitalForm, RecordStatus, ShiftType } from '@/common/types/digital-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDigitalFormPagination } from '@/hooks/digital-form';

const statusColors = {
  [RecordStatus.DRAFT]: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  [RecordStatus.PENDING]: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  [RecordStatus.CONFIRMED]: 'bg-green-100 text-green-800 hover:bg-green-200',
  [RecordStatus.REJECTED]: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const statusLabels = {
  [RecordStatus.DRAFT]: 'Nháp',
  [RecordStatus.PENDING]: 'Chờ duyệt',
  [RecordStatus.CONFIRMED]: 'Đã duyệt',
  [RecordStatus.REJECTED]: 'Từ chối',
};

const shiftLabels = {
  [ShiftType.REGULAR]: 'Thường',
  [ShiftType.EXTENDED]: 'Gia hạn',
  [ShiftType.OVERTIME]: 'Tăng ca',
};

export function FormList() {
  const router = useRouter();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');

  // Initialize the pagination hook
  const {
    forms,
    total,
    totalPages,
    page,
    limit,
    isLoading,
    isFetching,
    updateConditions,
    resetFilters,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
  } = useDigitalFormPagination({
    initialPage: 1,
    initialLimit: 10,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateConditions({ search });
  };

  const handleStatusChange = (value: string) => {
    updateConditions({ status: value as RecordStatus });
  };

  const handleShiftChange = (value: string) => {
    updateConditions({ shiftType: value as ShiftType });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      updateConditions({ dateFrom: format(date, 'yyyy-MM-dd') });
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    resetFilters();
  };

  const handleCreateForm = () => {
    router.push('/digital-forms/create');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Danh sách phiếu công đoạn</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
          <Button onClick={handleCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo phiếu mới
          </Button>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                placeholder="Tìm kiếm phiếu công đoạn..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div>
              <Select onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value={RecordStatus.DRAFT}>Nháp</SelectItem>
                  <SelectItem value={RecordStatus.PENDING}>Chờ duyệt</SelectItem>
                  <SelectItem value={RecordStatus.CONFIRMED}>Đã duyệt</SelectItem>
                  <SelectItem value={RecordStatus.REJECTED}>Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select onValueChange={handleShiftChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại ca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value={ShiftType.REGULAR}>Thường</SelectItem>
                  <SelectItem value={ShiftType.EXTENDED}>Gia hạn</SelectItem>
                  <SelectItem value={ShiftType.OVERTIME}>Tăng ca</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Search className="mr-2 h-4 w-4" />
                    Từ ngày
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    onSelect={handleDateChange}
                    disabled={date => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Button variant="ghost" onClick={handleClearFilters} className="w-full">
                <X className="mr-2 h-4 w-4" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      )}

      <CardContent>
        {isLoading || isFetching ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64">
            <p className="text-muted-foreground mb-4">Không tìm thấy phiếu công đoạn nào</p>
            <Button onClick={handleCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo phiếu mới
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Tên phiếu</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Ca làm việc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map(form => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.formCode}</TableCell>
                    <TableCell>{form.formName}</TableCell>
                    <TableCell>
                      {format(new Date(form.date), 'dd/MM/yyyy', { locale: vi })}
                    </TableCell>
                    <TableCell>{shiftLabels[form.shiftType]}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[form.status]}>
                        {statusLabels[form.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{form.createdByName || form.createdById}</TableCell>
                    <TableCell>
                      <Button variant="link" asChild>
                        <Link href={`/digital-forms/${form.id}`}>Chi tiết</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {forms.length > 0 && (
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {forms.length} trong tổng số {total} phiếu
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={prevPage} disabled={page <= 1}>
              Trước
            </Button>
            <div className="flex items-center text-sm space-x-1">
              <span>Trang</span>
              <Select value={page.toString()} onValueChange={value => goToPage(Number(value))}>
                <SelectTrigger className="w-14">
                  <SelectValue placeholder={page.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <SelectItem key={pageNum} value={pageNum.toString()}>
                      {pageNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>/ {totalPages}</span>
            </div>
            <Button variant="outline" onClick={nextPage} disabled={page >= totalPages}>
              Tiếp
            </Button>

            <Select value={limit.toString()} onValueChange={value => changeLimit(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default FormList;
