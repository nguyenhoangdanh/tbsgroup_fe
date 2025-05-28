import { z } from 'zod';

/**
 * Schema Zod cho UUID
 * Sử dụng để validate dữ liệu ID
 */
export const uuidSchema = z.string().uuid('ID phải là UUID hợp lệ');

/**
 * Schema Zod cho mảng UUID
 * Sử dụng để validate danh sách ID
 */
export const uuidArraySchema = z.array(uuidSchema).nonempty('Danh sách ID không được rỗng');

/**
 * Kiểm tra một chuỗi có phải là UUID hợp lệ không
 * @param id - chuỗi cần kiểm tra
 * @returns boolean - true nếu hợp lệ
 */
export const isValidUUID = (id: string): boolean => {
  try {
    uuidSchema.parse(id);
    return true;
  } catch (error) {
    console.error('ID không hợp lệ:', error);
    return false;
  }
};

/**
 * Đảm bảo một chuỗi là UUID hợp lệ trước khi sử dụng trong API
 * Nếu không hợp lệ, trả về null và tùy chọn hiển thị lỗi
 * @param id - chuỗi cần kiểm tra
 * @param showError - hàm hiển thị lỗi (tùy chọn)
 * @returns string | null - id nếu hợp lệ, null nếu không hợp lệ
 */
export const validateUUIDOrShowError = (
  id: string | undefined,
  showError?: (message: string) => void,
): string | null => {
  if (!id) {
    if (showError) showError('ID không được để trống');
    return null;
  }

  if (!isValidUUID(id)) {
    if (showError) showError(`ID không đúng định dạng UUID: ${id}`);
    return null;
  }

  return id;
};

/**
 * Tạo schema cho tham số trong URL
 * @param paramName Tên tham số
 * @returns Zod schema
 */
export const createParamSchema = (paramName: string) => {
  return z.object({
    [paramName]: uuidSchema,
  });
};
