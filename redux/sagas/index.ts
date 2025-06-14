import { all, fork } from 'redux-saga/effects';

import { authSaga } from './authSaga';

/**
 * Root saga that combines all application sagas
 */
export default function* rootSaga() {
  yield all([
    fork(authSaga),
    // Add other sagas here as needed
    // fork(userSaga),
    // fork(appSaga),
  ]);
}
