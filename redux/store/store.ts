import rootSaga from '@/redux/sagas';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { createWrapper } from 'next-redux-wrapper';
import { userReducer } from '../reducers/userReducer';
// import { surveyReducer, userReducer } from '../reducers/userReducer';
// import socketReducer from '../reducers/socket';
// import pingReducer from '../reducers/ping';
const rootReducer = combineReducers({
  user: userReducer,
//   survey: surveyReducer,
//   socket: socketReducer,
//   ping: pingReducer,
});

const sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware];

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(middleware),
});

sagaMiddleware.run(rootSaga);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const wrapper = createWrapper(() => store, { debug: true });