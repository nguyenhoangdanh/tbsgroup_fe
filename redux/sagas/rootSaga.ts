import { all, fork } from 'redux-saga/effects';

import { apiSaga } from './apiSaga';
import { authSaga } from './authSaga';

/**
 * Root saga that combines all sagas in the application
 */
export default function* rootSaga() {
  yield all([fork(authSaga), fork(apiSaga)]);
}
