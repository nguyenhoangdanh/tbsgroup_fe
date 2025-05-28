'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Save, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import { BatchCreateBagGroupRateDTO } from '@/apis/group/bagGroupRate/bag-group-rate.api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';
import { fetchWithAuth } from '@/lib/fetcher';

interface HandBag {
  id: string;
  code: string;
  name: string;
  imageUrl?: string;
}

interface Group {
  id: string;
  code: string;
  name: string;
  teamId: string;
  teamName?: string;
}

const rateItemSchema = z.object({
  id: z.string().optional(),
  groupId: z.string({ required_error: 'Vui lòng chọn nhóm' }),
  outputRate: z.preprocess(
    val => (val === '' ? undefined : Number(val)),
    z
      .number({ required_error: 'Vui lòng nhập năng suất' })
      .min(0, { message: 'Năng suất không thể là số âm' }),
  ),
  notes: z.string().optional(),
});

const formSchema = z.object({
  rates: z.array(rateItemSchema).min(1, { message: 'Cần có ít nhất một nhóm' }),
});

type FormValues = z.infer<typeof formSchema>;

const EditBagRates = () => {
  const router = useRouter();

  const { handleBatchCreateBagGroupRates } = useBagGroupRateContext();
  const [handBagId, setHandBagId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [handBag, setHandBag] = useState<HandBag | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rates: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rates',
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('handBagId');

    if (id) {
      setHandBagId(id);
    } else {
      setError('Không tìm thấy ID túi xách trong URL');
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const handBagResponse = await fetchWithAuth(`/hand-bags/${handBagId}`);
      console.log('HandBag response:', handBagResponse);

      if (handBagResponse && handBagResponse.data) {
        setHandBag(handBagResponse.data as HandBag);
      } else {
        throw new Error('Không thể tải thông tin túi xách');
      }

      const ratesResponse = await fetchWithAuth(`/bag-group-rates/hand-bag/${handBagId}`);

      if (ratesResponse && ratesResponse.data) {
        const ratesData = (
          ratesResponse.data as Array<{
            id: string;
            groupId: string;
            outputRate: number;
            notes?: string;
          }>
        ).map(rate => ({
          id: rate.id,
          groupId: rate.groupId,
          outputRate: rate.outputRate,
          notes: rate.notes || '',
        }));

        form.setValue('rates', ratesData);
      }

      const groupsResponse = await fetchWithAuth('/groups');
      console.log('Groups response:', groupsResponse);

      if (groupsResponse && groupsResponse.data) {
        setAvailableGroups(groupsResponse.data as Group[]);
      } else {
        throw new Error('Không thể tải danh sách nhóm');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu');
      toast.error({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
      });
    } finally {
      setLoading(false);
    }
  }, [handBagId, form]);

  const handleAddRate = () => {
    append({
      groupId: '',
      outputRate: 0,
      notes: '',
    });
  };

  const isGroupSelected = (groupId: string, currentIndex: number) => {
    const values = form.getValues();
    return values.rates.some((rate, index) => rate.groupId === groupId && index !== currentIndex);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      console.log('Submitting form with values:', values);

      if (values.rates.length === 0) {
        toast.error({
          title: 'Lỗi',
          description: 'Vui lòng thêm ít nhất một nhóm',
        });
        return;
      }

      const groupIds = values.rates.map(rate => rate.groupId);
      const uniqueGroupIds = new Set(groupIds);
      if (groupIds.length !== uniqueGroupIds.size) {
        toast.error({
          title: 'Lỗi',
          description: 'Có nhóm bị trùng lặp. Mỗi nhóm chỉ được cấu hình một lần.',
        });
        return;
      }

      const payload: BatchCreateBagGroupRateDTO = {
        handBagId: handBagId as string,
        groupRates: values.rates.map(rate => ({
          groupId: rate.groupId,
          outputRate: rate.outputRate,
          notes: rate.notes || undefined,
        })),
      };

      await handleBatchCreateBagGroupRates(payload);

      toast({
        title: 'Thành công',
        description: 'Cập nhật năng suất túi theo nhóm thành công!',
      });

      router.push('/bag-group-rates');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lưu dữ liệu',
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (handBagId) {
      fetchData();
    }
  }, [handBagId, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/bag-group-rates')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">
            {handBag ? `Cấu hình năng suất: ${handBag.name} (${handBag.code})` : 'Đang tải...'}
          </h1>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách năng suất theo nhóm</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="mb-4">
                <Button type="button" variant="outline" onClick={handleAddRate} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Thêm nhóm mới
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có dữ liệu năng suất. Vui lòng nhấn để bắt đầu.
                </div>
              ) : (
                <ScrollArea className="max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">STT</TableHead>
                        <TableHead>Nhóm</TableHead>
                        <TableHead className="w-40">Năng suất (SP/giờ)</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead className="w-24">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`rates.${index}.groupId`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={submitting}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Chọn nhóm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableGroups.map(group => (
                                        <SelectItem
                                          key={group.id}
                                          value={group.id}
                                          disabled={isGroupSelected(group.id, index)}
                                        >
                                          {group.code} - {group.name}
                                          {group.teamName && ` (Tổ: ${group.teamName})`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`rates.${index}.outputRate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.1}
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled={submitting}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`rates.${index}.notes`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="Nhập ghi chú (nếu có)"
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                      disabled={submitting}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={submitting}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn chắc chắn muốn xóa mục này? Thao tác này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => remove(index)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              <div className="flex justify-end mt-6 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/bag-group-rates')}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBagRates;
