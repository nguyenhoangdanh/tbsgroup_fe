// src/store/sagas/rootSaga.ts
import { all, fork } from 'redux-saga/effects';
import { authSaga } from './authSaga';
import { apiSaga } from './apiSaga';

/**
 * Root saga that combines all sagas in the application
 */
export default function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(apiSaga),
  ]);
}