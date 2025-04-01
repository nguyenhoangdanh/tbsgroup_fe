import { 
    Factory,
    FactoryCondDTO,
    FactoryCreateDTO,
    FactoryUpdateDTO,
    FactoryManagerDTO
  } from '@/common/interface/factory';
  import { BasePaginationParams, BaseResponseData } from '@/hooks/base/useBaseQueries';
  import { fetchWithAuth } from '@/lib/fetcher';
  
  // === FACTORY API FUNCTIONS ===
  
  /**
   * Lấy danh sách nhà máy theo điều kiện lọc và phân trang
   */
  export const getFactoriesList = async (
    params: FactoryCondDTO & BasePaginationParams
  ): Promise<BaseResponseData<Factory>> => {
    // Build query params
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    if (params.code) queryParams.append('code', params.code);
    if (params.name) queryParams.append('name', params.name);
    if (params.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params.managingDepartmentId) queryParams.append('managingDepartmentId', params.managingDepartmentId);
    if (params.departmentType) queryParams.append('departmentType', params.departmentType);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await fetchWithAuth(`/factories?${queryParams.toString()}`);
    return response;
  };
  
  /**
   * Lấy chi tiết một nhà máy theo ID
   */
  export const getFactoryById = async (id: string): Promise<Factory> => {
    const response = await fetchWithAuth(`/factories/${id}`);
    return response.data;
  };
  
  /**
   * Kiểm tra quyền quản lý nhà máy
   */
  export const checkCanManageFactory = async (factoryId: string): Promise<boolean> => {
    const response = await fetchWithAuth(`/factories/${factoryId}/can-manage`);
    return response.data;
  };
  
  /**
   * Lấy danh sách nhà máy có thể truy cập
   */
  export const getAccessibleFactories = async (): Promise<Factory[]> => {
    const response = await fetchWithAuth('/factories/accessible');
    return response.data;
  };
  
  /**
   * Tạo mới một nhà máy
   */
  export const createFactory = async (
    data: FactoryCreateDTO
  ): Promise<{ id: string }> => {
    const response = await fetchWithAuth('/factories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  
    return { id: response.data.id };
  };
  
  /**
   * Cập nhật thông tin nhà máy
   */
  export const updateFactory = async (
    id: string,
    data: FactoryUpdateDTO
  ): Promise<void> => {
    const response = await fetchWithAuth(`/factories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    return response.data;
  };
  
  /**
   * Xóa một nhà máy
   */
  export const deleteFactory = async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/factories/${id}`, {
      method: 'DELETE',
    });
    
    return response.data;
  };
  
  /**
   * Lấy danh sách quản lý của nhà máy
   */
  export const getFactoryManagers = async (factoryId: string): Promise<{
    userId: string;
    isPrimary: boolean;
    startDate: string;
    endDate: string | null;
    user?: {
      id: string;
      fullName: string;
      avatar?: string | null;
    };
  }[]> => {
    const response = await fetchWithAuth(`/factories/${factoryId}/managers`);
    return response.data;
  };
  
  /**
   * Thêm quản lý vào nhà máy
   */
  export const addFactoryManager = async (
    factoryId: string,
    managerDTO: FactoryManagerDTO
  ): Promise<void> => {
    const response = await fetchWithAuth(`/factories/${factoryId}/managers`, {
      method: 'POST',
      body: JSON.stringify(managerDTO),
    });
    
    return response.data;
  };
  
  /**
   * Cập nhật thông tin quản lý nhà máy
   */
  export const updateFactoryManager = async (
    factoryId: string,
    userId: string,
    data: {
      isPrimary?: boolean;
      endDate?: Date | null; // Đã thêm null để tương thích với type được sử dụng
    }
  ): Promise<void> => {
    const response = await fetchWithAuth(`/factories/${factoryId}/managers/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    return response.data;
  };
  
  /**
   * Xóa quản lý khỏi nhà máy
   */
  export const removeFactoryManager = async (
    factoryId: string,
    userId: string
  ): Promise<void> => {
    const response = await fetchWithAuth(`/factories/${factoryId}/managers/${userId}`, {
      method: 'DELETE',
    });
    
    return response.data;
  };
  
  /**
   * Liên kết nhà máy với phòng ban quản lý
   */
  export const linkFactoryWithDepartment = async (
    factoryId: string,
    departmentId: string
  ): Promise<void> => {
    const response = await fetchWithAuth(`/factories/${factoryId}/link-department`, {
      method: 'POST',
      body: JSON.stringify({ departmentId }),
    });
    
    return response.data;
  };
  
  // Batch delete multiple factories in parallel
  export const batchDeleteFactoriesParallel = async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => deleteFactory(id)));
  };