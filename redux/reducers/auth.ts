import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface IInitialState {
  isAuthenticated: boolean;
}

type TAuthenticateSuccessPayload = PayloadAction<Pick<IInitialState, 'isAuthenticated'>>;

const initialState: IInitialState = {
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'authentication',
  initialState,

  reducers: {
    authenticateSuccess: (state, { payload }: TAuthenticateSuccessPayload) => {
      Object.assign(state, payload);
    },
  },
});

export const { authenticateSuccess } = authSlice.actions;

export const authReducer = authSlice.reducer;
