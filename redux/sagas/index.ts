import { spawn } from 'redux-saga/effects';
import reduxSaga from './sagas';

export default function* rootSaga() {
  yield spawn(reduxSaga);
}