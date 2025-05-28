import { useCallback } from 'react';

import { toast } from 'react-toast-kit';

/**
 * Hook xử lý tác vụ CRUD chung cho các form
 */
export function useCrudHandlers<T>({
  entityName,
  onCreate,
  onUpdate,
  onDelete,
  invalidateCache,
  refetchData,
}: {
  entityName: string;
  onCreate?: (data: any) => Promise<string | null>;
  onUpdate?: (id: string, data: any) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  invalidateCache?: (id: string, force?: boolean) => Promise<void>;
  refetchData?: () => Promise<void>;
  navigate?: (path: string) => void;
}) {
  const handleCreate = useCallback(
    async (data: any) => {
      try {
        if (!onCreate) throw new Error('Create handler not provided');

        const newId = await onCreate(data);

        if (newId) {
          toast({
            title: 'Thành công',
            description: `Đã tạo ${entityName} mới`,
            duration: 2000,
          });

          if (invalidateCache) await invalidateCache(newId, true);
          if (refetchData) await refetchData();

          return newId;
        }
        return null;
      } catch (error) {
        toast({
          title: `Lỗi tạo ${entityName}`,
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
          variant: 'error',
        });
        return null;
      }
    },
    [entityName, onCreate, invalidateCache, refetchData],
  );

  const handleUpdate = useCallback(
    async (id: string, data: any) => {
      try {
        if (!onUpdate) throw new Error('Update handler not provided');

        const success = await onUpdate(id, data);

        if (success) {
          toast({
            title: 'Thành công',
            description: `Đã cập nhật ${entityName}`,
            duration: 2000,
          });

          if (invalidateCache) await invalidateCache(id, true);
          if (refetchData) await refetchData();

          return true;
        }
        return false;
      } catch (error) {
        toast({
          title: `Lỗi cập nhật ${entityName}`,
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
          variant: 'error',
        });
        return false;
      }
    },
    [entityName, onUpdate, invalidateCache, refetchData],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        if (!onDelete) throw new Error('Delete handler not provided');

        const success = await onDelete(id);

        if (success) {
          toast({
            title: 'Thành công',
            description: `Đã xóa ${entityName}`,
            duration: 2000,
          });

          if (refetchData) await refetchData();

          return true;
        }
        return false;
      } catch (error) {
        toast({
          title: `Lỗi xóa ${entityName}`,
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
          variant: 'error',
        });
        return false;
      }
    },
    [entityName, onDelete, refetchData],
  );

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
