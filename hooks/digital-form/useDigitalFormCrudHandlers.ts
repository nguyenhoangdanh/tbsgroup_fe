// hooks/useDigitalFormCrudHandlers.ts
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  TDigitalFormCreate, 
  TDigitalFormUpdate, 
  TDigitalFormEntry 
} from '@/schemas/digital-form.schema';
import { DigitalForm } from '@/common/types/digital-form';

/**
 * Hook for handling CRUD operations on digital forms with proper error handling
 */
export function useDigitalFormCrudHandlers({
    entityName = 'biểu mẫu số',
    onCreateForm,
    onUpdateForm,
    onDeleteForm,
    onAddEntry,
    onDeleteEntry,
    onSubmitForm,
    onApproveForm,
    onRejectForm,
    invalidateCache,
    refetchForms,
    navigate
}: {
    entityName?: string;
    onCreateForm?: (data: TDigitalFormCreate) => Promise<string | null>;
    onUpdateForm?: (id: string, data: TDigitalFormUpdate) => Promise<boolean>;
    onDeleteForm?: (id: string) => Promise<boolean>;
    onAddEntry?: (formId: string, data: TDigitalFormEntry) => Promise<string | null>;
    onDeleteEntry?: (formId: string, entryId: string) => Promise<boolean>;
    onSubmitForm?: (formId: string) => Promise<boolean>;
    onApproveForm?: (formId: string) => Promise<boolean>;
    onRejectForm?: (formId: string) => Promise<boolean>;
    invalidateCache?: (id: string, force?: boolean) => Promise<void>;
    refetchForms?: () => Promise<void>;
    navigate?: (path: string) => void;
}) {
    // Handler for creating a form
    const handleCreateForm = useCallback(async (data: TDigitalFormCreate) => {
        try {
            if (!onCreateForm) throw new Error('Create handler not provided');
            
            const newId = await onCreateForm(data);
            
            if (newId) {
                toast({
                    title: 'Thành công',
                    description: `Đã tạo ${entityName} mới`,
                    duration: 2000
                });
                
                if (invalidateCache) await invalidateCache(newId, true);
                if (refetchForms) await refetchForms();
                
                return newId;
            }
            return null;
        } catch (error) {
            toast({
                title: `Lỗi tạo ${entityName}`,
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            });
            return null;
        }
    }, [entityName, onCreateForm, invalidateCache, refetchForms]);
    
    // Handler for updating a form
    const handleUpdateForm = useCallback(async (id: string, data: TDigitalFormUpdate) => {
        try {
            if (!onUpdateForm) throw new Error('Update handler not provided');
            
            const success = await onUpdateForm(id, data);
            
            if (success) {
                toast({
                    title: 'Thành công',
                    description: `Đã cập nhật ${entityName}`,
                    duration: 2000
                });
                
                if (invalidateCache) await invalidateCache(id, true);
                if (refetchForms) await refetchForms();
                
                return true;
            }
            return false;
        } catch (error) {
            toast({
                title: `Lỗi cập nhật ${entityName}`,
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            });
            return false;
        }
    }, [entityName, onUpdateForm, invalidateCache, refetchForms]);
    
    // Handler for deleting a form
    const handleDeleteForm = useCallback(async (id: string) => {
        try {
            if (!onDeleteForm) throw new Error('Delete handler not provided');
            
            const success = await onDeleteForm(id);
            
            if (success) {
                toast({
                    title: 'Thành công',
                    description: `Đã xóa ${entityName}`,
                    duration: 2000
                });
                
                if (refetchForms) await refetchForms();
                
                return true;
            }
            return false;
        } catch (error) {
            toast({
                title: `Lỗi xóa ${entityName}`,
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            });
            return false;
        }
    }, [entityName, onDeleteForm, refetchForms]);
    
    // Handler for adding an entry to a form
    const handleAddEntry = useCallback(async (formId: string, data: TDigitalFormEntry) => {
        try {
            if (!onAddEntry) throw new Error('Add entry handler not provided');
            
            const entryId = await onAddEntry(formId, data);
            
            if (entryId) {
                toast({
                    title: 'Thành công',
                    description: `Đã thêm dữ liệu vào ${entityName}`,
                    duration: 2000
                });
                
                if (invalidateCache) await invalidateCache(formId, true);
                
                return entryId;
            }
            return null;
        } catch (error) {
            toast({
                title: `Lỗi thêm dữ liệu`,
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            });
            return null;
        }
    }, [entityName, onAddEntry, invalidateCache]);
    
    // Handler for deleting an entry from a form
    const handleDeleteEntry = useCallback(async (formId: string, entryId: string) => {
        try {
            if (!onDeleteEntry) throw new Error('Delete entry handler not provided');
            
            const success = await onDeleteEntry(formId, entryId);
            
            if (success) {
                toast({
                    title: 'Thành công',
                    description: `Đã xóa dữ liệu khỏi ${entityName}`,
                    duration: 2000
                });
                
                if (invalidateCache) await invalidateCache(formId, true);
                
                return true;
            }
            return false;
        } catch (error) {
            toast({
                title: `Lỗi xóa dữ liệu`,
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            });
            return false;
        }
    }, [entityName, onDeleteEntry, invalidateCache]);
    
    // Handler for submitting a form
    const handleSubmitForm = useCallback(async (formId: string) => {
        try {
            if (!onSubmitForm) throw new Error('Submit handler not provided');
            
            const success = await onSubmitForm(formId);
            
            if (success) {
                toast({
                    title: 'Thành công',
                    description: `Đã gửi ${entityName} thành công`,
                    duration: 2000
                });
                
                if (invalidateCache) await invalidateCache(formId, true);
                if (refetchForms) await refetchForms();
                
                return true;
            }
            return false;
        } catch (error) {
            toast({
                title: `Lỗi gửi ${entityName}`,
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            });
            return false;
        }
    }, [entityName, onSubmitForm, invalidateCache, refetchForms]);
    
    // Handler for approving a form
    const handleApproveForm = useCallback(async (formId: string) => {
        try {
            if (!onApproveForm) throw new Error('Approve handler not provided');
            
            const success = await onApproveForm(formId);
            
            if (success) {
                toast({
                    title: 'Thành công',
                    description: `Đã phê duyệt ${entityName}`,
                    duration: 2000
                });
                
                if (invalidateCache) await invalidateCache(formId, true);
                if (refetchForms) await refetchForms();
                
                return true;
            }
            return false;
        } catch (error) {
            toast({
                title: `Lỗi phê duyệt ${entityName}`,
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            });
            return false;
        }
    }, [entityName, onApproveForm, invalidateCache, refetchForms]);
    
    // Handler for rejecting a form
    const handleRejectForm = useCallback(async (formId: string) => {
        try {
            if (!onRejectForm) throw new Error('Reject handler not provided');
            
            const success = await onRejectForm(formId);
            
            if (success) {
                toast({
                    title: 'Thành công',
                    description: `Đã từ chối ${entityName}`,
                    duration: 2000
                });
                
                if (invalidateCache) await invalidateCache(formId, true);
                if (refetchForms) await refetchForms();
                
                return true;
            }
            return false;
        } catch (error) {
            toast({
                title: `Lỗi từ chối ${entityName}`,
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            });
            return false;
        }
    }, [entityName, onRejectForm, invalidateCache, refetchForms]);
    
    // Handle navigation to form detail page
    const handleViewForm = useCallback((form: DigitalForm) => {
        if (navigate) {
            navigate(`/digital-forms/${form.id}`);
        }
    }, [navigate]);
    
    // Handle navigation to form edit page
    const handleEditForm = useCallback((form: DigitalForm) => {
        if (navigate) {
            navigate(`/digital-forms/${form.id}/edit`);
        }
    }, [navigate]);
    
    return {
        handleCreateForm,
        handleUpdateForm,
        handleDeleteForm,
        handleAddEntry,
        handleDeleteEntry,
        handleSubmitForm,
        handleApproveForm,
        handleRejectForm,
        handleViewForm,
        handleEditForm
    };
}