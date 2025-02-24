import { PING, PING_FAILURE, PING_SUCCESS } from '../actions';

interface IPingState {
  isConnected: boolean;
  error: string | null;
}

interface IRequestAction {
  type: typeof PING;
}

interface ISuccessAction {
  type: typeof PING_SUCCESS;
  payload: IPingState;
}

interface IFailureAction {
  type: typeof PING_FAILURE;
  payload: string;
}
const initialState: IPingState = {
  isConnected: false,
  error: null,
};

type TPingActions = IRequestAction | ISuccessAction | IFailureAction;

const pingReducer = (state: IPingState = initialState, action: TPingActions): IPingState => {
  switch (action.type) {
    case PING:
      return {
        ...state,
        isConnected: false,
      };
    case PING_SUCCESS:
      return {
        ...state,
        isConnected: true,
        error: null,
      };
    case PING_FAILURE:
      return {
        ...state,
        isConnected: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default pingReducer;
