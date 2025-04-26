import React from "react";
import { DialogChildrenProps } from "@/contexts/DialogProvider";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import { toast } from "@/hooks/use-toast";
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";
import MultiGroupForm from "./MultiGroupForm";
import { BatchCreateBagGroupRateDTO } from "@/apis/group/bagGroupRate/bag-group-rate.api";

// Mở rộng DialogChildrenProps để có thể thêm các props tùy chỉnh
interface MultiGroupBatchWrapperProps extends Partial<DialogChildrenProps> {
    isSubmitting?: boolean;
    isReadOnly?: boolean;
    isEdit?: boolean;
    onSubmit?: (data: BatchCreateBagGroupRateDTO) => Promise<boolean | void>;
    onClose?: () => void;
    data?: any;
}

/**
 * Wrapper cho MultiGroupForm để đảm bảo context được cung cấp
 * Component này tuân theo định dạng của DialogProvider
 */
const MultiGroupBatchWrapper: React.FC<MultiGroupBatchWrapperProps> = (props) => {
    return (
        <BagGroupRateContextBridge>
            <MultiGroupBatchWrapperInner {...props} />
        </BagGroupRateContextBridge>
    );
};

/**
 * Component nội dung sử dụng context
 * Đảm bảo chỉ truy cập context sau khi bridge đã cung cấp nó nếu cần
 */
const MultiGroupBatchWrapperInner: React.FC<MultiGroupBatchWrapperProps> = ({
    data,
    isSubmitting = false,
    isReadOnly = false,
    isEdit = false,
    type,
    onSubmit: propOnSubmit,
    onClose = () => { },
}) => {
    const { handleBatchCreateBagGroupRates, handleBatchUpdateBagGroupRates, safeRefetch } = useBagGroupRateContext();

    // Xác định chế độ chỉnh sửa từ props hoặc từ type của DialogProvider
    const isEditMode = isEdit || type === "edit";
    const isReadOnlyMode = isReadOnly || type === "view";

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
            // Sử dụng onSubmit từ props nếu có
            if (propOnSubmit) {
                return await propOnSubmit(formData) || false;
            }

            let result;
            // Nếu không có propOnSubmit, sử dụng hàm mặc định từ context
            if (isEditMode) {
                // Sử dụng hàm cập nhật nếu đang ở chế độ chỉnh sửa
                result = await handleBatchUpdateBagGroupRates(formData);

                if (result && result.length > 0) {
                    toast({
                        title: "Thành công",
                        description: `Đã cập nhật ${result.length} năng suất cho các nhóm thành công`,
                    });
                }
            } else {
                // Sử dụng hàm tạo mới nếu đang ở chế độ tạo mới
                result = await handleBatchCreateBagGroupRates(formData);

                if (result && result.length > 0) {
                    toast({
                        title: "Thành công",
                        description: `Đã lưu ${result.length} năng suất cho các nhóm thành công`,
                    });
                }
            }

            // Cập nhật dữ liệu nếu thành công
            if (result && result.length > 0) {
                // Cập nhật dữ liệu
                safeRefetch();

                // Trả về true để đóng dialog (trong DialogProvider, true nghĩa là đóng)
                return true;
            }

            return false;
        } catch (error) {
            console.error(`Lỗi khi ${isEditMode ? 'cập nhật' : 'tạo'} năng suất hàng loạt:`, error);
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu dữ liệu",
                variant: "destructive",
            });
            return false;
        }
    };

    return (
        <div className="dialog-content-container">
            <div className="dialog-scrollable-wrapper">
                <MultiGroupForm
                    onSubmit={handleSubmit}
                    data={data}
                    isSubmitting={isSubmitting}
                    isReadOnly={isReadOnlyMode}
                    onClose={onClose}
                    isEdit={isEditMode}
                />
            </div>
        </div>
    );
};

export default MultiGroupBatchWrapper;