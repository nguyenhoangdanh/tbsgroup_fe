import { FETCH_PO_HANDBAG, FETCH_PO_HANDBAG_FAILURE, FETCH_PO_HANDBAG_SUCCESS } from '../actions';

interface HandbagState {
  loading: boolean;
  data: any;
  error: string | null;
}

export interface IFetchPOHandBagRequestAction {
  type: typeof FETCH_PO_HANDBAG;
}

export interface IFetchPOHandBagSuccessAction {
  type: typeof FETCH_PO_HANDBAG_SUCCESS;
  payload: any;
}

export interface IFetchPOHandBagFailureAction {
  type: typeof FETCH_PO_HANDBAG_FAILURE;
  payload: string;
}

export type THandbagActions =
  | IFetchPOHandBagRequestAction
  | IFetchPOHandBagSuccessAction
  | IFetchPOHandBagFailureAction;

const initialState: HandbagState = {
  loading: false,
  data: null,
  error: null,
};

export const handbagReducer = (
  state: HandbagState = initialState,
  action: THandbagActions,
): HandbagState => {
  switch (action.type) {
    case FETCH_PO_HANDBAG:
      return { ...state, loading: true, error: null };
    case FETCH_PO_HANDBAG_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case FETCH_PO_HANDBAG_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
