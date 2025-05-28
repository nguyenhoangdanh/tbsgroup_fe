'use client';

import { RefreshCw, BarChart3 } from 'lucide-react';

import { formatDate } from '../digital-form.utils';

import { RecordStatus } from '@/common/types/digital-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FormHeaderProps {
  formData: any;
  onOpenStats: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FormHeader({ formData, onOpenStats, onRefresh, isRefreshing }: FormHeaderProps) {
  const getOrganizationInfo = () => {
    try {
      // Kiểm tra xem formData có trường workers hay entries không
      const workers = formData.workers || [];

      if (workers.length > 0 && workers[0].user) {
        const user = workers[0].user;
        return {
          factoryName: user.factory?.name || formData.factoryName || 'Không xác định',
          lineName: user.line?.name || formData.lineName || 'Không xác định',
          teamName: user.team?.name || formData.teamName || 'Không xác định',
          groupName: user.group?.name || formData.groupName || 'Không xác định',
        };
      }

      //  Fallback to form data
      return {
        factoryName: formData.factoryName || 'Không xác định',
        lineName: formData.lineName || 'Không xác định',
        teamName: formData.teamName || 'Không xác định',
        groupName: formData.groupName || 'Không xác định',
      };
    } catch (error) {
      console.error('Error getting organization info:', error);
      return {
        factoryName: formData.factoryName || 'Không xác định',
        lineName: formData.lineName || 'Không xác định',
        teamName: formData.teamName || 'Không xác định',
        groupName: formData.groupName || 'Không xác định',
      };
    }
  };

  const { factoryName, lineName, teamName, groupName } = getOrganizationInfo();
  return (
    <CardHeader className="pb-3 border-b">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            {formData.formName}
            <Badge
              variant="outline"
              className={
                formData.status === RecordStatus.DRAFT
                  ? 'bg-gray-100'
                  : formData.status === RecordStatus.PENDING
                    ? 'bg-amber-100 text-amber-700'
                    : formData.status === RecordStatus.CONFIRMED
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
              }
            >
              {formData.status === RecordStatus.DRAFT
                ? 'Nháp'
                : formData.status === RecordStatus.PENDING
                  ? 'Chờ duyệt'
                  : formData.status === RecordStatus.CONFIRMED
                    ? 'Đã duyệt'
                    : 'Từ chối'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Mã: {formData.formCode} | {formatDate(new Date(formData.date))}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onOpenStats}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Thống kê
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Xem thống kê chi tiết</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* Line & Team info */}
      <div className="flex flex-col gap-x-6 gap-y-2 text-sm mt-3 text-muted-foreground">
        <div>
          <span className="font-medium">Nhà máy:</span> {factoryName}
        </div>
        <div>
          <span className="font-medium">Tổ:</span> {teamName}
        </div>
        <div>
          <span className="font-medium">Chuyền:</span> {lineName}
        </div>
        {groupName && groupName !== 'Không xác định' && (
          <div>
            <span className="font-medium">Nhóm:</span> {groupName}
          </div>
        )}
      </div>
    </CardHeader>
  );
}
