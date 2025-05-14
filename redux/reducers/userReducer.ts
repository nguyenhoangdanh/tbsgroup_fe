// Action types with const assertions for type safety and autocompletion

// import { type IUserInfo } from '@/provider/interfaces/user';
import { FETCH_USER_FAILURE, FETCH_USER, FETCH_USER_SUCCESS } from '../actions';
// import { IExam } from '@/provider/interfaces/survey';

// TypeScript interfaces for the state and action types
interface IUserState {
  loading: boolean;
  data: string | null;
  error: string | null;
}

export interface IFetchDataRequestAction {
  type: typeof FETCH_USER;
}

interface IFetchDataSuccessAction {
  type: typeof FETCH_USER_SUCCESS;
  payload: any; // Replace 'any' with the actual data type
}

interface IFetchDataFailureAction {
  type: typeof FETCH_USER_FAILURE;
  payload: string;
}

// Union type for actions
export type TUserActions =
  | IFetchDataRequestAction
  | IFetchDataSuccessAction
  | IFetchDataFailureAction;

const initialState: IUserState = {
  loading: false,
  data: null,
  error: null,
};
export const userReducer = (state: IUserState = initialState, action: TUserActions): IUserState => {
  switch (action.type) {
    case FETCH_USER:
      return { ...state, loading: true, error: null };
    case FETCH_USER_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case FETCH_USER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
