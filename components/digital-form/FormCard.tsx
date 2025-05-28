import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Pencil, Trash2, Send, Check, X, FileText } from 'lucide-react';
import React from 'react';

import { DigitalForm, RecordStatus, ShiftType } from '@/common/types/digital-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDigitalFormContext } from '@/hooks/digital-form';

const statusColors = {
  [RecordStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
  [RecordStatus.PENDING]: 'bg-blue-100 text-blue-800',
  [RecordStatus.CONFIRMED]: 'bg-green-100 text-green-800',
  [RecordStatus.REJECTED]: 'bg-red-100 text-red-800',
};

const statusLabels = {
  [RecordStatus.DRAFT]: 'Nháp',
  [RecordStatus.PENDING]: 'Chờ duyệt',
  [RecordStatus.CONFIRMED]: 'Đã duyệt',
  [RecordStatus.REJECTED]: 'Từ chối',
};

const shiftLabels = {
  [ShiftType.REGULAR]: 'Ca thường',
  [ShiftType.EXTENDED]: 'Ca gia hạn',
  [ShiftType.OVERTIME]: 'Ca tăng ca',
};

interface FormCardProps {
  form: DigitalForm;
  onUpdateForm?: () => void;
  onDeleteForm?: () => void;
  onSubmitForm?: () => void;
  onApproveForm?: () => void;
  onRejectForm?: () => void;
}

export function FormCard({
  form,
  onUpdateForm,
  onDeleteForm,
  onSubmitForm,
  onApproveForm,
  onRejectForm,
}: FormCardProps) {
  const { isDraftForm, isPendingForm } = useDigitalFormContext();
  const [formName, setFormName] = React.useState(form.formName);
  const [formDescription, setFormDescription] = React.useState(form.description || '');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    if (onUpdateForm) {
      onUpdateForm();
    }
  };

  const handleDelete = () => {
    setIsDeleting(false);
    if (onDeleteForm) {
      onDeleteForm();
    }
  };

  const handleSubmitForm = () => {
    setIsSubmitting(false);
    if (onSubmitForm) {
      onSubmitForm();
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <Badge className={statusColors[form.status] || ''}>
              {statusLabels[form.status] || 'Không xác định'}
            </Badge>
            <CardTitle className="mt-2 text-2xl">{form.formName}</CardTitle>
            <CardDescription>{form.formCode}</CardDescription>
          </div>
          <div className="space-x-1">
            {isDraftForm() && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Chỉnh sửa thông tin phiếu</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setIsDeleting(true)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Xóa phiếu</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setIsSubmitting(true)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gửi phiếu duyệt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            {isPendingForm() && onApproveForm && onRejectForm && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-green-600"
                        onClick={onApproveForm}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duyệt phiếu</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600"
                        onClick={onRejectForm}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Từ chối phiếu</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            {form.status === RecordStatus.CONFIRMED && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Xuất báo cáo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Ngày</div>
            <div>{format(new Date(form.date), 'dd/MM/yyyy', { locale: vi })}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Ca làm việc</div>
            <div>{shiftLabels[form.shiftType] || form.shiftType}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Người tạo</div>
            <div>{form.createdByName || form.createdById}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Nhà máy</div>
            <div>{form.factoryName || form.factoryId}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Dây chuyền</div>
            <div>{form.lineName || form.lineId}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Tổ</div>
            <div>{form.teamName || form.teamId || 'N/A'}</div>
          </div>
        </div>

        {form.description && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-500">Mô tả</div>
            <div className="mt-1 text-gray-700">{form.description}</div>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-sm text-gray-500 flex justify-between">
        <div>Cập nhật: {format(new Date(form.updatedAt), 'HH:mm dd/MM/yyyy', { locale: vi })}</div>
        {form.submitTime && (
          <div>
            Gửi duyệt: {format(new Date(form.submitTime), 'HH:mm dd/MM/yyyy', { locale: vi })}
          </div>
        )}
        {form.approvedAt && (
          <div>Duyệt: {format(new Date(form.approvedAt), 'HH:mm dd/MM/yyyy', { locale: vi })}</div>
        )}
      </CardFooter>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin phiếu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin phiếu công đoạn. Nhấn Lưu khi hoàn thành.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="formName">Tên phiếu</Label>
                <Input
                  id="formName"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="formDescription">Mô tả</Label>
                <Textarea
                  id="formDescription"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa phiếu công đoạn này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={isSubmitting} onOpenChange={setIsSubmitting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận gửi duyệt</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gửi phiếu này để duyệt? Sau khi gửi duyệt, bạn sẽ không thể
              chỉnh sửa thêm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitting(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmitForm}>Gửi duyệt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default FormCard;
