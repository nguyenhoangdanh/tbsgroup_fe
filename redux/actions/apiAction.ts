export const API_REQUEST = 'API_REQUEST';
export const API_SUCCESS = 'API_SUCCESS';
export const API_ERROR = 'API_ERROR';

export interface ApiRequestPayload {
  endpoint: string;
  method: string;
  data?: any;
  onSuccess?: string;
  onError?: string;
  meta?: any;
}

export interface ApiSuccessPayload {
  data: any;
  meta?: any;
}

export interface ApiErrorPayload {
  error: string;
  meta?: any;
}

export interface ApiRequestAction {
  type: typeof API_REQUEST;
  payload: ApiRequestPayload;
}

export interface ApiSuccessAction {
  type: typeof API_SUCCESS;
  payload: ApiSuccessPayload;
}

export interface ApiErrorAction {
  type: typeof API_ERROR;
  payload: ApiErrorPayload;
}

export type ApiActionTypes = ApiRequestAction | ApiSuccessAction | ApiErrorAction;

export const apiRequest = (
  endpoint: string,
  method: string = 'GET',
  data: any = null,
  onSuccess: string | null = null,
  onError: string | null = null,
  meta: any = {},
): ApiRequestAction => ({
  type: API_REQUEST,
  payload: {
    endpoint,
    method,
    data,
    onSuccess: onSuccess || undefined,
    onError: onError || undefined,
    meta,
  },
});

export const apiSuccess = (data: any, meta: any = {}): ApiSuccessAction => ({
  type: API_SUCCESS,
  payload: { data, meta },
});

export const apiError = (error: string, meta: any = {}): ApiErrorAction => ({
  type: API_ERROR,
  payload: { error, meta },
});
