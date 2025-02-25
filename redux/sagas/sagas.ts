import { fetchAllHandbagStages } from "@/actions/admin/handbag";
import { SagaConst } from "@/constant/saga.constant";
import {
  fetchDataFailure,
  FETCH_USER,
  SOCKET_CONNECT,
  socketConnectSuccess,
  DISCONNECT,
  SOCKET_CONNECT_FAILURE,
  PING,
  PING_FAILURE,
  PING_SUCCESS,
  RESET_STATE_SOCKET,
  FETCH_HANDBAG_SUCCESS,
  FETCH_PO_HANDBAG_FAILURE,
  FETCH_PO_HANDBAG_SUCCESS,
  FETCH_PO_HANDBAG,
} from "@/redux/actions";
import { all, call, put, fork, takeEvery } from "redux-saga/effects";
//   import { aboutme } from '@/provider/api/user';
//   import { getAllSurvey } from '@/provider/api/survey';
//   import { type IExam } from '@/provider/interfaces/survey';
//   import { SagaConst } from '@/common';
import {
  type ManagerOptions,
  type SocketOptions,
  type Socket,
  io,
} from "socket.io-client";

interface IConnectResponse {
  success: boolean;
  error?: string;
}
// -----------------------------------------------------------------------------
let socket: Socket | null;

function* getUserInfoSaga(): Generator {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //   const response: any = yield call(aboutme);
    //   if (response?.data) {
    //     yield put(fetchDataSuccess(response?.data));
    //   }
  } catch (_error) {
    yield put(fetchDataFailure("Failed to fetch user information"));
  }
}

function* getAllHandbagStages(): Generator {
  try {
    const response = yield call(fetchAllHandbagStages);
    if (response.success) {
      yield put({
        type: FETCH_PO_HANDBAG_SUCCESS,
        payload: response.handbagStages,
      });
    } else {
      yield put({
        type: FETCH_PO_HANDBAG_FAILURE,
        payload: "Failed to fetch handbag stages",
      });
    }
  } catch (_error) {
    yield put({
      type: FETCH_PO_HANDBAG_FAILURE,
      payload: "Failed to fetch handbag stages",
    });
  }
}

function* pingConnection(): Generator {
  try {
    if (socket) {
      socket.on("heartbeat", function () {
        // console.log('ping sent successfully!');
        if (socket) {
          socket.emit("heartbeat");
        }
      });
      yield put({ type: PING_SUCCESS });
    } else {
      yield all([
        put({ type: PING_FAILURE, payload: "Failed to ping connection" }),
        put({
          type: SOCKET_CONNECT_FAILURE,
          payload: "Failed to connect socket",
        }),
        put({ type: RESET_STATE_SOCKET, payload: { isConnected: false } }),
      ]);
    }
  } catch (_error) {
    yield put({ type: PING_FAILURE, payload: "Socket connection error" });
  }
}

function* disconnect() {
  if (socket) {
    socket.emit("manual-disconnect");
    socket.disconnect();
    yield all([
      put({
        type: SOCKET_CONNECT_FAILURE,
        payload: "Failed to connect socket",
      }),
      put({ type: RESET_STATE_SOCKET, payload: { isConnected: false } }),
    ]);
  }
}

const connect = async (socketProps: {
  host: string;
  options?: Partial<ManagerOptions & SocketOptions> & {
    forceJSONP?: boolean;
    path?: string;
    extraHeaders?: Record<string, string>;
    query?: Record<string, string>;
  };
}): Promise<IConnectResponse> => {
  const { host, options = {} } = socketProps;

  if (!socketProps?.host) {
    return { success: false, error: "Invalid Socket IO Props!" };
  }

  socket = io(host, { ...options });

  socket.emit("authenticate");

  return await new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error("Socket initialization failed"));
      return;
    }
    socket.on("authenticated", () => {
      if (socket) {
        socket.emit("exam-count-down");
        resolve({ success: true });
      } else {
        resolve({ success: false, error: "Socket is null after connect" });
      }
    });

    socket.on("connect_error", () => {
      socket = null;
      resolve({ success: false, error: "Socket connection error" });
    });

    socket.on("disconnect", () => {
      socket = null;
      resolve({ success: false, error: "Socket disconnected" });
    });
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// function* socketConnection(action: any): Generator {
//   try {
//     const response = (yield call(connect, {
//       host: SagaConst.BASE_URL,
//       options: {
//         forceJSONP: true,
//         path: SagaConst.STREAM,
//         reconnection: true,
//         reconnectionAttempts: 10,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         extraHeaders: {
//           Authorization: `Bearer ${action.payload.token}`,
//         },
//         query: {
//           userId: action.payload.userId,
//           variantId: action.payload.variantId,
//         },
//       },
//     })) as IConnectResponse;
//     if (response.success) {
//       yield put(socketConnectSuccess(true));
//     } else {
//       yield put({ type: SOCKET_CONNECT_FAILURE, payload: 'Failed to connect socket' });
//     }
//   } catch (_error) {
//     yield put({ type: SOCKET_CONNECT_FAILURE, payload: 'Failed to connect socket' });
//   }
// }

// Watcher saga for getUserInfo action
function* watchGetUserInfo() {
  yield takeEvery(FETCH_USER, getUserInfoSaga);
}

// function* watchSocketEstablish() {
//   yield takeEvery(SOCKET_CONNECT, socketConnection);
// }

function* watchEmitSaveDraft() {
  yield takeEvery(DISCONNECT, disconnect);
}

function* watchPingConnection() {
  yield takeEvery(PING, pingConnection);
}

function* watchGetPOHandbag() {
  yield takeEvery(FETCH_PO_HANDBAG, getAllHandbagStages);
}

// Include the watcher saga in your root saga
export default function* sagas() {
  yield all([
    fork(watchGetUserInfo),
    fork(watchEmitSaveDraft),
    fork(watchPingConnection),
    fork(watchGetPOHandbag),
  ]);
}
