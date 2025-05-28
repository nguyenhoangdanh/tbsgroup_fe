import {
  Team,
  TeamCondDTO,
  TeamCreateDTO,
  TeamUpdateDTO,
  TeamLeaderDTO,
  TeamLeader,
} from '@/common/interface/team';
import { BasePaginationParams, BaseResponseData } from '@/hooks/base/useBaseQueries';
import { fetchWithAuth } from '@/lib/fetcher';

// === TEAM API FUNCTIONS ===

/**
 * Lấy danh sách tổ theo điều kiện lọc và phân trang
 */
export const getTeamsList = async (
  params: TeamCondDTO & BasePaginationParams,
): Promise<BaseResponseData<Team>> => {
  // Build query params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  if (params.code) queryParams.append('code', params.code);
  if (params.name) queryParams.append('name', params.name);
  if (params.lineId) queryParams.append('lineId', params.lineId);
  if (params.search) queryParams.append('search', params.search);

  const response = await fetchWithAuth(`/teams?${queryParams.toString()}`);
  return response;
};

/**
 * Lấy chi tiết một tổ theo ID
 */
export const getTeamById = async (id: string): Promise<Team> => {
  const response = await fetchWithAuth(`/teams/${id}`);
  return response.data;
};

/**
 * Kiểm tra quyền quản lý tổ
 */
export const checkCanManageTeam = async (teamId: string): Promise<boolean> => {
  const response = await fetchWithAuth(`/teams/${teamId}/can-manage`);
  return response.data;
};

/**
 * Lấy danh sách tổ có thể truy cập
 */
export const getAccessibleTeams = async (): Promise<Team[]> => {
  const response = await fetchWithAuth('/teams/accessible');
  return response.data;
};

/**
 * Lấy danh sách tổ theo dây chuyền
 */
export const getTeamsByLine = async (lineId: string): Promise<Team[]> => {
  const response = await fetchWithAuth(`/teams/line/${lineId}`);
  return response.data;
};

/**
 * Tạo mới một tổ
 */
export const createTeam = async (data: TeamCreateDTO): Promise<{ id: string }> => {
  const response = await fetchWithAuth('/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { id: response.data.id };
};

/**
 * Cập nhật thông tin tổ
 */
export const updateTeam = async (id: string, data: TeamUpdateDTO): Promise<void> => {
  const response = await fetchWithAuth(`/teams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
};

/**
 * Xóa một tổ
 */
export const deleteTeam = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`/teams/${id}`, {
    method: 'DELETE',
  });

  return response.data;
};

/**
 * Lấy danh sách trưởng nhóm của tổ
 */
export const getTeamLeaders = async (teamId: string): Promise<TeamLeader[]> => {
  const response = await fetchWithAuth(`/teams/${teamId}/leaders`);
  return response.data;
};

/**
 * Thêm trưởng nhóm vào tổ
 */
export const addTeamLeader = async (teamId: string, leaderDTO: TeamLeaderDTO): Promise<void> => {
  const response = await fetchWithAuth(`/teams/${teamId}/leaders`, {
    method: 'POST',
    body: JSON.stringify(leaderDTO),
  });

  return response.data;
};

/**
 * Cập nhật thông tin trưởng nhóm của tổ
 */
export const updateTeamLeader = async (
  teamId: string,
  userId: string,
  data: {
    isPrimary?: boolean;
    endDate?: Date | null;
  },
): Promise<void> => {
  const response = await fetchWithAuth(`/teams/${teamId}/leaders/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return response.data;
};

/**
 * Xóa trưởng nhóm khỏi tổ
 */
export const removeTeamLeader = async (teamId: string, userId: string): Promise<void> => {
  const response = await fetchWithAuth(`/teams/${teamId}/leaders/${userId}`, {
    method: 'DELETE',
  });

  return response.data;
};

/**
 * Batch delete multiple teams in parallel
 */
export const batchDeleteTeamsParallel = async (ids: string[]): Promise<void> => {
  await Promise.all(ids.map(id => deleteTeam(id)));
};
