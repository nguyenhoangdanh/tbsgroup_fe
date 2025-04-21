"use client";

import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Plus, ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

// Shadcn UI components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// Types
interface Worker {
  id: string;
  name: string;
  code: string;
  department: string;
  totalReports: number;
  status: 'active' | 'inactive';
}

interface WorkerReport {
  id: string;
  date: string;
  bagCode: string;
  operationName: string;
  workingTime: string;
  totalProduction: number;
  status: 'pending' | 'approved' | 'rejected';
}

// Zod validation schema for report form
const reportFormSchema = z.object({
  date: z.string().nonempty({ message: "Ngày làm việc là bắt buộc" }),
  workingTime: z.string().nonempty({ message: "Thời gian làm việc là bắt buộc" }),
  bagCode: z.string().nonempty({ message: "Mã túi là bắt buộc" }),
  operationCode: z.string().nonempty({ message: "Công đoạn là bắt buộc" }),
  hourlyProduction: z.record(z.string(), z.number().min(0).or(z.string().transform(val => {
    const num = parseInt(val);
    return isNaN(num) ? 0 : num;
  }))),
  materialReason: z.string().optional(),
  technologyReason: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const TeamLeaderDashboard: React.FC = () => {
  // State for workers under team leader management
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [workerReports, setWorkerReports] = useState<WorkerReport[]>([]);

  // Set up form with validation
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      workingTime: "8_hours",
      bagCode: "",
      operationCode: "",
      hourlyProduction: {},
      materialReason: "",
      technologyReason: "",
    },
  });

  // Mock data for demonstration
  useEffect(() => {
    // This would be replaced with an actual API call
    const mockWorkers: Worker[] = [
      { id: '1', name: 'Nguyễn Văn A', code: 'NV001', department: 'Sản xuất', totalReports: 6, status: 'active' },
      { id: '2', name: 'Trần Thị B', code: 'NV002', department: 'Hoàn thiện', totalReports: 4, status: 'active' },
      { id: '3', name: 'Lê Văn C', code: 'NV003', department: 'Kiểm tra chất lượng', totalReports: 2, status: 'active' },
      { id: '4', name: 'Phạm Thị D', code: 'NV004', department: 'Sản xuất', totalReports: 3, status: 'active' },
      { id: '5', name: 'Hoàng Văn E', code: 'NV005', department: 'Hoàn thiện', totalReports: 5, status: 'active' },
    ];
    setWorkers(mockWorkers);
  }, []);

  // Generate mock reports when a worker is selected
  useEffect(() => {
    if (selectedWorker) {
      const mockReports: WorkerReport[] = Array.from({ length: 5 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - index);

        return {
          id: `report-${index}`,
          date: date.toISOString().split('T')[0],
          bagCode: `BAG00${Math.floor(Math.random() * 5) + 1}`,
          operationName: ['May lót', 'May thân', 'May ráp', 'Chặt', 'Lạng'][Math.floor(Math.random() * 5)],
          workingTime: ['8 tiếng', '9 tiếng 30 phút', '11 tiếng'][Math.floor(Math.random() * 3)],
          totalProduction: Math.floor(Math.random() * 200) + 50,
          status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as 'pending' | 'approved' | 'rejected',
        };
      });

      setWorkerReports(mockReports);
    }
  }, [selectedWorker]);

  // Filter workers based on search term
  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle worker selection
  const handleSelectWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsAddingReport(false);
  };

  // Handle back to worker list
  const handleBackToList = () => {
    setSelectedWorker(null);
    setIsAddingReport(false);
  };

  // Handle report form submission
  const onSubmit = (data: ReportFormValues) => {
    console.log('Form submitted:', data);

    // Calculate total production
    const totalProduction = Object.values(data.hourlyProduction).reduce(
      (sum, value) => sum + (typeof value === 'number' ? value : 0),
      0
    );

    console.log('Total production:', totalProduction);

    // In a real app, you would submit this data to your API
    // After successful submission, close the form
    setIsAddingReport(false);
  };

  // Get time slots based on working time
  const getTimeSlots = (workingTime: string): string[] => {
    switch (workingTime) {
      case "8_hours":
        return ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:30'];
      case "9.5_hours":
        return ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:30', '16:30-17:00', '17:00-18:00'];
      case "11_hours":
        return ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:30', '17:00-18:00', '18:00-19:00', '19:00-20:00'];
      default:
        return ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:30'];
    }
  };

  // Update hourly production fields when working time changes
  const handleWorkingTimeChange = (value: string) => {
    form.setValue('workingTime', value);

    // Reset hourly production fields
    const timeSlots = getTimeSlots(value);
    const hourlyProduction: Record<string, number> = {};

    timeSlots.forEach(slot => {
      hourlyProduction[slot] = 0;
    });

    form.setValue('hourlyProduction', hourlyProduction);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with team leader info */}
      <header className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Quản lý báo cáo sản lượng</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Nhóm trưởng: Lê Minh Quân</span>
            <Badge variant="outline" className="bg-green-100 text-green-800">Đang trực tuyến</Badge>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4">
        {!selectedWorker ? (
          // Workers list view
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-medium">Danh sách công nhân</h2>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      type="text"
                      placeholder="Tìm kiếm theo tên, mã số..."
                      className="pl-10 pr-4 py-2 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <Input
                      type="date"
                      className="w-auto"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead>Tên & Mã công nhân</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Báo cáo hôm nay</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker, index) => (
                    <TableRow
                      key={worker.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectWorker(worker)}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                            <div className="text-sm text-gray-500">{worker.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{worker.department}</TableCell>
                      <TableCell>
                        {Math.random() > 0.5 ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Đã báo cáo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            Chưa báo cáo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Đang làm việc
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900 mr-2">Xem</Button>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-900">Báo cáo</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          // Worker detail view with reports
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="mr-4"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Quay lại
                  </Button>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">{selectedWorker.name}</h2>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-4">Mã: {selectedWorker.code}</span>
                        <span>Đơn vị: {selectedWorker.department}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setIsAddingReport(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm báo cáo mới
                </Button>
              </div>

              {isAddingReport ? (
                // Report form with react-hook-form and zod validation
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">1. Thông tin cơ bản</h4>
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ngày làm việc</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="workingTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thời gian</FormLabel>
                                <Select
                                  onValueChange={(value) => handleWorkingTimeChange(value)}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Chọn thời gian làm việc" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="8_hours">8 tiếng (07:30 - 16:30)</SelectItem>
                                    <SelectItem value="9.5_hours">9 tiếng 30 phút (07:30 - 18:00)</SelectItem>
                                    <SelectItem value="11_hours">11 tiếng (07:30 - 20:00)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Thông tin công nhân</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div className="flex">
                            <span className="w-32 text-sm font-medium text-gray-500">Họ tên:</span>
                            <span className="text-sm">{selectedWorker.name}</span>
                          </div>
                          <div className="flex">
                            <span className="w-32 text-sm font-medium text-gray-500">Mã nhân viên:</span>
                            <span className="text-sm">{selectedWorker.code}</span>
                          </div>
                          <div className="flex">
                            <span className="w-32 text-sm font-medium text-gray-500">Đơn vị:</span>
                            <span className="text-sm">{selectedWorker.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">2. Chi tiết công việc</h4>

                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Công việc #1</span>
                            <Button variant="link" className="text-blue-600 hover:text-blue-800 text-sm">+ Thêm công việc khác</Button>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name="bagCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mã túi</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Chọn mã túi" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="BAG001">BAG001 - Túi loại A</SelectItem>
                                      <SelectItem value="BAG002">BAG002 - Túi loại B</SelectItem>
                                      <SelectItem value="BAG003">BAG003 - Túi loại C</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="operationCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tên công đoạn</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Chọn công đoạn" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="OP001">May lót</SelectItem>
                                      <SelectItem value="OP002">May thân</SelectItem>
                                      <SelectItem value="OP003">May ráp</SelectItem>
                                      <SelectItem value="OP004">Chặt</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Chi tiết sản lượng theo giờ:</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                              {getTimeSlots(form.watch('workingTime')).map(timeSlot => (
                                <FormField
                                  key={timeSlot}
                                  control={form.control}
                                  name={`hourlyProduction.${timeSlot}`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs text-gray-500">{timeSlot}</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                          value={field.value || ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Nguyên nhân (nếu có):</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="materialReason"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-gray-500">Nguyên nhân vật tư</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        rows={2}
                                        placeholder="Nhập nguyên nhân..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="technologyReason"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-gray-500">Nguyên nhân công nghệ</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        rows={2}
                                        placeholder="Nhập nguyên nhân..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingReport(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                      >
                        Lưu báo cáo
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                // Worker reports list
                <div>
                  <div className="p-4 bg-gray-50 border-b flex items-center justify-between mb-4 rounded-t-lg">
                    <h3 className="font-medium">Báo cáo sản lượng</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-500 mr-2" />
                        <Input
                          type="date"
                          className="w-auto"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                        />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả trạng thái</SelectItem>
                          <SelectItem value="pending">Chờ duyệt</SelectItem>
                          <SelectItem value="approved">Đã duyệt</SelectItem>
                          <SelectItem value="rejected">Từ chối</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Mã túi</TableHead>
                        <TableHead>Công đoạn</TableHead>
                        <TableHead>Thời gian làm việc</TableHead>
                        <TableHead>Sản lượng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workerReports.map((report) => (
                        <TableRow key={report.id} className="hover:bg-gray-50">
                          <TableCell>
                            {format(new Date(report.date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>{report.bagCode}</TableCell>
                          <TableCell>{report.operationName}</TableCell>
                          <TableCell>{report.workingTime}</TableCell>
                          <TableCell className="font-medium">{report.totalProduction}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                            }>
                              {report.status === 'pending' ? 'Chờ duyệt' :
                                report.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900 mr-2">Xem</Button>
                            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-900 mr-2">Sửa</Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">Xóa</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TeamLeaderDashboard;