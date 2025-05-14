'use client';

import { useState, useCallback, useEffect } from 'react';
import { Worker } from '@/common/types/worker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useForm } from '@/contexts/form-context';
import { AddBagForm } from './add-bag-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface MultiBagTimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker;
  timeSlot: string;
  onSuccess?: () => void;
}

export function MultiBagTimeSlotDialog({
  open,
  onOpenChange,
  worker,
  timeSlot,
  onSuccess,
}: MultiBagTimeSlotDialogProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [editingBag, setEditingBag] = useState<{
    entryId: string;
    bagName: string;
    currentValue: number;
  } | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingBag, setDeletingBag] = useState<{
    entryId: string;
    bagName: string;
  } | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { getBagsForTimeSlot, addBagForTimeSlot, updateBagTimeSlotOutput, refreshData } = useForm();

  // Get all bags for this worker in this time slot
  const bagsInTimeSlot = getBagsForTimeSlot?.(worker.id, timeSlot) || [];

  // Reset the editing state when the dialog opens/closes or when the time slot changes
  useEffect(() => {
    if (open && timeSlot) {
      setEditingBag(null);
      setQuantity(0);
      setDeletingBag(null);
      setConfirmDeleteOpen(false);
    }
  }, [open, timeSlot]);

  // Handler for adding a new bag
  const handleAddBag = useCallback(
    async (bagData: {
      bagId: string;
      bagName: string;
      processId: string;
      processName: string;
      colorId: string;
      colorName: string;
    }) => {
      if (!addBagForTimeSlot) return false;

      try {
        const success = await addBagForTimeSlot(worker.id, {
          ...bagData,
          timeSlot,
          quantity: 0,
        });

        if (success) {
          setActiveTab('current');
          await refreshData?.();
        }

        return success;
      } catch (error) {
        console.error('Error adding bag:', error);
        return false;
      }
    },
    [worker.id, timeSlot, addBagForTimeSlot, refreshData],
  );

  // Handler for updating bag output
  const handleUpdateOutput = useCallback(async () => {
    if (!editingBag || !updateBagTimeSlotOutput) return;

    setIsUpdating(true);

    try {
      const success = await updateBagTimeSlotOutput(editingBag.entryId, timeSlot, quantity);

      if (success) {
        setEditingBag(null);
        await refreshData?.();
      }
    } catch (error) {
      console.error('Error updating output:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [editingBag, timeSlot, quantity, updateBagTimeSlotOutput, refreshData]);

  // Start editing a bag's output
  const startEditing = useCallback((bag: { entryId: string; bagName: string; output: number }) => {
    setEditingBag({
      entryId: bag.entryId,
      bagName: bag.bagName,
      currentValue: bag.output,
    });
    setQuantity(bag.output);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingBag(null);
  }, []);

  // Handle dialog close
  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setActiveTab('current');
        setEditingBag(null);
        setQuantity(0);
        setDeletingBag(null);
        setConfirmDeleteOpen(false);
      }

      onOpenChange(open);
    },
    [onOpenChange],
  );

  // Confirm delete bag
  const confirmDeleteBag = useCallback((bag: { entryId: string; bagName: string }) => {
    setDeletingBag(bag);
    setConfirmDeleteOpen(true);
  }, []);

  // Delete bag
  const handleDeleteBag = useCallback(async () => {
    if (!deletingBag) return;

    setIsDeleting(true);

    try {
      // For this example, we'll set quantity to 0 to effectively "remove" the bag
      // In a real implementation, you might want an actual delete endpoint
      const success = await updateBagTimeSlotOutput?.(deletingBag.entryId, timeSlot, 0);

      if (success) {
        setConfirmDeleteOpen(false);
        setDeletingBag(null);
        await refreshData?.();
      }
    } catch (error) {
      console.error('Error deleting bag from time slot:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [deletingBag, timeSlot, updateBagTimeSlotOutput, refreshData]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Túi làm việc trong khung giờ {timeSlot}</DialogTitle>
            <DialogDescription>
              Quản lý các túi mà công nhân {worker.name || worker.user?.fullName} làm trong khung giờ {timeSlot}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'current' | 'add')}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="current">Túi hiện tại</TabsTrigger>
              <TabsTrigger value="add">Thêm túi mới</TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              {bagsInTimeSlot.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Chưa có túi nào trong khung giờ này</p>
                  <Button onClick={() => setActiveTab('add')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Thêm túi mới
                  </Button>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Túi</TableHead>
                        <TableHead className="text-right">Số lượng</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bagsInTimeSlot.map(bag => (
                        <TableRow key={`${bag.entryId}-${bag.bagId}`}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{bag.bagName}</div>
                              <div className="text-xs text-muted-foreground">
                                {bag.processName} - {bag.colorName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{bag.output}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(bag)}
                                className="h-8 w-8 p-0"
                              >
                                <Loader2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDeleteBag(bag)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveTab('add')}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Thêm túi khác
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="add">
              <AddBagForm
                workerId={worker.id}
                timeSlot={timeSlot}
                onAddBag={handleAddBag}
                onSuccess={() => setActiveTab('current')}
              />
            </TabsContent>
          </Tabs>

          {/* Editing Dialog */}
          {editingBag && (
            <div className="mt-4 border rounded-md p-4">
              <h4 className="font-medium mb-2">Cập nhật sản lượng</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Cập nhật sản lượng cho túi <span className="font-medium">{editingBag.bagName}</span>{' '}
                trong khung giờ {timeSlot}
              </p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Nhập số lượng"
                    disabled={isUpdating}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isUpdating}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={handleUpdateOutput} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Cập nhật'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa túi {deletingBag?.bagName} khỏi khung giờ {timeSlot}?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBag}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xác nhận xóa'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
