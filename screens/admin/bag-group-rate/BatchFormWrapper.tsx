// MultiGroupBatchWrapper.tsx - Tương tự như BatchFormWrapper nhưng giữ để tránh xung đột
import React from "react";
import { DialogChildrenProps } from "@/context/DialogProvider";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import { toast } from "@/hooks/use-toast";
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";
import MultiGroupForm from "./MultiGroupForm";
import { BatchCreateBagGroupRateDTO } from "@/apis/group/bagGroupRate/bag-group-rate.api";

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

    // Xử lý gửi form
    const handleSubmit = async (formData: BatchCreateBagGroupRateDTO): Promise<boolean> => {
        if (!formData || !formData.handBagId || !formData.groupRates || formData.groupRates.length === 0) {
            toast({
                title: "Lỗi",
                description: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
                variant: "destructive",
            });
            return false;
        }

        try {
            // Sử dụng hàm từ context để xử lý tạo hàng loạt
            const result = await handleBatchCreateBagGroupRates(formData);

            // Cập nhật dữ liệu nếu thành công
            if (result && result.length > 0) {
                toast({
                    title: "Thành công",
                    description: `Đã lưu ${result.length} năng suất cho các nhóm thành công`,
                });

                // Cập nhật dữ liệu
                safeRefetch();

                // Trả về true để đóng dialog (trong DialogProvider, true nghĩa là đóng)
                return true;
            }

            return false;
        } catch (error) {
            console.error("Lỗi khi tạo năng suất hàng loạt:", error);
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu dữ liệu",
                variant: "destructive",
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