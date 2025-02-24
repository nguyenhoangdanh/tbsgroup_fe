// import { type IExam } from '@/provider/interfaces/survey';
// import { IUserInfo } from '@/provider/interfaces/user';

// export const doAction = (type: string, data?: any) => ({ type, data });

// -------------------------------------------------------------------------
export const FETCH_USER = 'FETCH_USER';
export const FETCH_USER_SUCCESS = 'FETCH_USER_SUCCESS';
export const FETCH_USER_FAILURE = 'FETCH_USER_FAILURE';

export const fetchDataRequest = () => ({
  type: FETCH_USER,
});

export const fetchDataSuccess = (data?: any) => ({
  type: FETCH_USER_SUCCESS,
  payload: data,
});

export const fetchDataFailure = (error: string) => ({
  type: FETCH_USER_FAILURE,
  payload: error,
});

// -------------------------------------------------------------------------
export const SOCKET_CONNECT = 'SOCKET_CONNECT';
export const SOCKET_CONNECT_SUCCESS = 'SOCKET_CONNECT_SUCCESS';
export const SOCKET_CONNECT_FAILURE = 'SOCKET_CONNECT_FAILURE';
export const DISCONNECT = 'DISCONNECT';
export const RESET_STATE_SOCKET = 'RESET_STATE_SOCKET';
export const socketConnect = (userId: string, variantId: string) => ({
  type: SOCKET_CONNECT,
  payload: { userId, variantId },
});
export const socketConnectSuccess = (data: boolean) => ({ type: SOCKET_CONNECT_SUCCESS, payload: data });
export const socketConnectFailure = (error: string) => ({ type: SOCKET_CONNECT_FAILURE, payload: error });

export const PING = 'PING';
export const PING_SUCCESS = 'PING_SUCCESS';
export const PING_FAILURE = 'PING_FAILURE';
export const pingConnection = () => ({ type: PING });
export const pingConnectionSuccess = (data: boolean) => ({ type: PING_SUCCESS, payload: data });
export const pingConnectionFailure = (error: string) => ({ type: PING_FAILURE, payload: error });
