import { all, fork } from 'redux-saga/effects';

import { apiSaga } from './apiSaga';
import { authSaga } from './authSaga';
// import { sagas } from './sagas';

export default function* rootSaga() {
  // yield spawn(reduxSaga);
  yield all([fork(authSaga), fork(apiSaga)]);
}
