import { RESET_STATE_SOCKET, SOCKET_CONNECT, SOCKET_CONNECT_FAILURE, SOCKET_CONNECT_SUCCESS } from '../actions';
interface ISocketState {
  isConnected: boolean;
  userId?: string;
  variantId?: string; // Add variantId property
  error?: string | null;
}

interface IRequestAction {
  type: typeof SOCKET_CONNECT;
  payload: {
    userId?: string;
    variantId?: string;
  };
}

interface ISuccessAction {
  type: typeof SOCKET_CONNECT_SUCCESS;
  payload: boolean; // Replace 'any' with the actual data type
}

interface IFailureAction {
  type: typeof SOCKET_CONNECT_FAILURE;
  payload: string;
}

interface IResetSateSocket {
  type: typeof RESET_STATE_SOCKET;
  payload: {
    isConnected: boolean;
  };
}

const initialState: ISocketState = {
  isConnected: false,
  userId: undefined,
  variantId: undefined,
  error: null,
};

// Union type for actions
export type TSocketActions = IRequestAction | ISuccessAction | IFailureAction | IResetSateSocket;

const socketReducer = (state: ISocketState = initialState, action: TSocketActions): ISocketState => {
  switch (action.type) {
    case SOCKET_CONNECT:
      return {
        ...state,
        isConnected: false,
        userId: action.payload.userId,
        variantId: action.payload.variantId,
      };
    case SOCKET_CONNECT_SUCCESS:
      return {
        ...state,
        isConnected: true,
        error: null,
      };
    case SOCKET_CONNECT_FAILURE:
      return {
        ...state,
        isConnected: false,
        error: action.payload,
      };
    case RESET_STATE_SOCKET:
      return {
        isConnected: false,
      };
    default:
      return state;
  }
};

export default socketReducer;
