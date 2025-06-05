// import { call, put, takeLatest } from 'redux-saga/effects';

// import { fetchAllHandbagStages } from '@/actions/admin/handbag';
// import {
//   FETCH_PO_HANDBAG_FAILURE,
//   FETCH_PO_HANDBAG_SUCCESS,
//   FETCH_PO_HANDBAG,
// } from '@/redux/actions';

// function* getAllHandbagStages(): Generator {
//   try {
//     const response = yield call(fetchAllHandbagStages);
//     if (response.success) {
//       yield put({
//         type: FETCH_PO_HANDBAG_SUCCESS,
//         payload: response.handbagStages,
//       });
//     } else {
//       yield put({
//         type: FETCH_PO_HANDBAG_FAILURE,
//         payload: 'Failed to fetch handbag stages',
//       });
//     }
//   } catch (error) {
//     console.error('Error fetching handbag stages:', error);
//     yield put({
//       type: FETCH_PO_HANDBAG_FAILURE,
//       payload: 'Failed to fetch handbag stages',
//     });
//   }
// }

// export function* sagas() {
//   yield takeLatest(FETCH_PO_HANDBAG, getAllHandbagStages);
// }
