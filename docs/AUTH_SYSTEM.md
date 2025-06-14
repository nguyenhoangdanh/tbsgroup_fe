# Hệ Thống Xác Thực Thông Minh (Smart Authentication System)

## Tổng Quan

Hệ thống xác thực mới được thiết kế để cung cấp trải nghiệm người dùng mượt mà và bảo mật cao với khả năng tự động khôi phục session, cache thông minh và xử lý lỗi tiên tiến.

## Kiến Trúc Hệ Thống

### 1. **AuthSessionManager** - Quản lý Session Thông Minh
- **Singleton pattern** đảm bảo chỉ có một instance duy nhất
- **Tự động khởi tạo session** khi ứng dụng bắt đầu
- **Theo dõi sự kiện browser** (visibility change, online/offline)
- **Throttling thông minh** để tránh gọi API quá nhiều

```typescript
// Sử dụng AuthSessionManager
import { authSessionManager } from '@/services/auth/AuthSessionManager';

// Khởi tạo session (tự động được gọi bởi SagaProvider)
await authSessionManager.initializeSession();

// Force refresh khi cần thiết
authSessionManager.forceSessionRefresh();
```

### 2. **Enhanced Redux Store** - Lưu Trữ Thông Minh
- **Redux Persist** với custom transform để bảo mật
- **Không lưu trữ token** - chỉ lưu thông tin user
- **Hydration tracking** để biết khi nào state đã được khôi phục
- **Session initialization flag** để tránh khởi tạo nhiều lần

### 3. **Smart Session Hooks** - Hooks Thông Minh

#### `useSmartSession`
```typescript
const {
  validateSession,      // Kiểm tra session với throttling
  forceRefresh,        // Buộc refresh session
  isSessionExpired,    // Kiểm tra session có hết hạn không
  needsRefresh,        // Session cần refresh không
  sessionInfo          // Thông tin chi tiết session
} = useSmartSession();
```

#### `useAuthManager` (Enhanced)
```typescript
const {
  // Trạng thái cơ bản
  user, isAuthenticated, status,
  
  // Trạng thái nâng cao
  isReady,             // App đã sẵn sàng chưa
  isInitializing,      // Đang khởi tạo session
  hasError,            // Có lỗi không
  
  // Phương thức hành động
  login, logout, forceRefresh,
  
  // Thông tin session
  sessionInfo,         // Chi tiết session
  isLoggedIn,          // Kết hợp authenticated + not expired
  canRefresh           // Có thể refresh không
} = useAuthManager();
```

### 4. **Session Recovery** - Khôi Phục Tự Động
- **Tự động phát hiện lỗi** session và thử khôi phục
- **Retry mechanism** với số lần thử có thể cấu hình
- **Fallback UI** khi khôi phục thất bại
- **Manual recovery** cho phép người dùng thử lại

```tsx
<SessionRecovery
  maxRetries={3}
  onRecoveryAttempt={(attempt) => console.log(`Attempt ${attempt}`)}
  onRecoverySuccess={() => console.log('Recovered!')}
  onRecoveryFailed={() => console.log('Failed!')}
>
  {children}
</SessionRecovery>
```

### 5. **Session Status Indicator** - Hiển Thị Trạng Thái
- **Visual indicator** trạng thái session (chỉ trong development)
- **Detailed panel** với thông tin debug
- **Quick actions** để force refresh, log debug, re-login

## Luồng Hoạt Động

### 1. **Khởi Tạo Ứng Dụng (App Initialization)**

```
1. SagaProvider render
2. AuthSessionManager.initializeSession()
3. Đợi Redux Persist hydration
4. Dispatch initializeApp action
5. AuthSaga xử lý:
   - Nếu có cached user: validate với server
   - Nếu không có cached user: check cookies
6. Cập nhật auth state tương ứng
```

### 2. **Xử Lý Tab Mới/Refresh Browser**

```
1. Redux Persist tự động restore cached user data
2. AuthSessionManager phát hiện có cached data
3. Trigger session validation với server
4. Nếu valid: giữ user data + update expiry
5. Nếu invalid: clear cache + redirect login
```

### 3. **Xử Lý Lỗi Session**

```
1. SessionRecovery phát hiện lỗi session
2. Tự động trigger recovery attempt
3. Clear errors → Force refresh → Wait for result
4. Nếu thành công: continue normal flow
5. Nếu thất bại: hiển thị recovery UI
```

### 4. **Background Session Management**

```
1. Theo dõi visibility change (tab switching)
2. Nếu > 5 phút kể từ lần check cuối → force refresh
3. Auto-refresh khi session sắp hết hạn (< 1 giờ)
4. Theo dõi online/offline events
```

## Cấu Hình và Tùy Chỉnh

### Environment Variables
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Session Management
NEXT_PUBLIC_SESSION_TIMEOUT=7200000  # 2 hours in ms
NEXT_PUBLIC_ENABLE_SESSION_DEBUG=true
```

### Store Configuration
```typescript
// trong redux/store.ts
const persistConfig = {
  key: 'root',
  storage: createSmartStorage(),
  whitelist: ['auth'],
  transforms: [
    // Custom transform loại bỏ sensitive data
  ]
};
```

### Session Timeouts
```typescript
const MIN_SESSION_CHECK_INTERVAL = 10000;     // 10 seconds
const VISIBILITY_REFRESH_THRESHOLD = 300000;  // 5 minutes
const AUTO_REFRESH_THRESHOLD = 3600000;       // 1 hour
```

## API Integration

### Backend Requirements
```typescript
// API endpoints cần thiết:
GET  /users/profile     // Lấy thông tin user hiện tại
POST /auth/login        // Đăng nhập (set HTTP-only cookies)
POST /auth/logout       // Đăng xuất (clear cookies)
POST /auth/refresh      // Refresh token (optional, cookies tự động handle)
```

### Cookie Configuration
```typescript
// Backend cần set cookies với:
{
  httpOnly: true,        // Bảo mật
  secure: true,          // HTTPS only in production
  sameSite: 'strict',    // CSRF protection
  maxAge: 7 * 24 * 3600  // 7 days
}
```

## Debugging và Troubleshooting

### Development Tools
1. **SessionStatusIndicator**: Hiển thị trạng thái real-time
2. **Console logs**: Detailed logging với emoji prefixes
3. **Session diagnostics**: Thông tin debug đầy đủ

### Common Issues

#### 1. Session không tự động restore
```typescript
// Check Redux Persist
const state = store.getState();
console.log('Auth state:', state.auth);
console.log('Is hydrated:', state.auth.isHydrated);
```

#### 2. Quá nhiều API calls
```typescript
// Check throttling
const { sessionInfo } = useAuthManager();
console.log('Last check:', sessionInfo.lastCheck);
console.log('Time since last check:', Date.now() - sessionInfo.lastCheck);
```

#### 3. Session recovery loops
```typescript
// Check recovery attempts
const sessionManager = authSessionManager.getSessionInfo();
console.log('Session manager info:', sessionManager);
```

### Performance Monitoring
```typescript
// Track session check frequency
console.time('session-check');
// ... session check logic
console.timeEnd('session-check');

// Monitor hydration time
console.time('hydration');
// ... wait for hydration
console.timeEnd('hydration');
```

## Migration Guide

### Từ hệ thống cũ sang hệ thống mới:

1. **Update imports**:
```typescript
// Cũ
import { useAuth } from './useAuth';

// Mới  
import { useAuthManager } from '@/hooks/auth/useAuthManager';
```

2. **Update usage**:
```typescript
// Cũ
const { isLoggedIn, checkSession } = useAuth();

// Mới
const { isLoggedIn, checkSession, forceRefresh } = useAuthManager();
```

3. **Add providers**:
```tsx
// Wrap app với SessionRecovery
<SessionRecovery>
  <YourApp />
</SessionRecovery>
```

## Best Practices

1. **Chỉ sử dụng `forceRefresh` khi thực sự cần thiết** - hệ thống đã tự động handle
2. **Không gọi session check trong useEffect** - để AuthSessionManager quản lý
3. **Sử dụng `isReady` flag** trước khi render content cần auth
4. **Check `isLoggedIn`** thay vì chỉ `isAuthenticated` để đảm bảo session chưa hết hạn
5. **Enable SessionStatusIndicator** trong development để debug

## Security Considerations

1. **HTTP-only cookies**: Tokens không thể truy cập từ JavaScript
2. **No token storage**: Không lưu tokens trong localStorage/sessionStorage
3. **Session validation**: Luôn validate với server khi restore session
4. **Auto logout**: Tự động logout khi session hết hạn
5. **Error handling**: Không expose sensitive errors ra UI

## Future Enhancements

1. **Offline support**: Cache actions và sync khi online
2. **Multi-tab synchronization**: Đồng bộ session across tabs
3. **Advanced retry strategies**: Exponential backoff, circuit breaker
4. **Session analytics**: Track session duration, failures
5. **Biometric authentication**: WebAuthn integration
