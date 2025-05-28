import React from 'react';
import { toast } from 'react-toast-kit';

import { BagGroupRateContextBridge } from './BagGroupRateContextBridge';
import MultiGroupForm from './MultiGroupForm';

import { BatchCreateBagGroupRateDTO } from '@/apis/group/bagGroupRate/bag-group-rate.api';
import { DialogChildrenProps } from '@/contexts/DialogProvider';
import { useBagGroupRateContext } from '@/hooks/group/bag-group-rate/BagGroupRateContext';

/**
 * Wrapper cho MultiGroupForm để đảm bảo context được cung cấp
 * Component này tuân theo định dạng của DialogProvider
 */
const BatchFormWrapper = (props: DialogChildrenProps) => {
  return (
    <BagGroupRateContextBridge>
      <BatchFormWrapperInner {...props} />
    </BagGroupRateContextBridge>
  );
};

/**
 * Component nội dung sử dụng context
 * Đảm bảo chỉ truy cập context sau khi bridge đã cung cấp nó nếu cần
 */
const BatchFormWrapperInner = (props: DialogChildrenProps) => {
  const { handleBatchCreateBagGroupRates, safeRefetch } = useBagGroupRateContext();
  const { onClose, data, isSubmitting } = props;

  const handleSubmit = async (formData: BatchCreateBagGroupRateDTO): Promise<boolean> => {
    if (
      !formData ||
      !formData.handBagId ||
      !formData.groupRates ||
      formData.groupRates.length === 0
    ) {
      toast.error({
        title: 'Lỗi',
        description: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
      });
      return false;
    }

    try {
      const result = await handleBatchCreateBagGroupRates(formData);

      if (result && result.length > 0) {
        toast({
          title: 'Thành công',
          description: `Đã lưu ${result.length} năng suất cho các nhóm thành công`,
        });

        safeRefetch();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Lỗi khi tạo năng suất hàng loạt:', error);
      toast.error({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lưu dữ liệu',
      });
      return false;
    }
  };

  return (
    <MultiGroupForm
      onSubmit={handleSubmit}
      data={data}
      isSubmitting={isSubmitting}
      onClose={onClose}
    />
  );
};

export default BatchFormWrapper;
