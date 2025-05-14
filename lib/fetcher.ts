// lib/fetcher.ts (sửa đổi để khắc phục lỗi TypeScript)

/**
 * Hàm gọi API cơ bản với xử lý lỗi nâng cao
 */
export const fetcher = async (url: string, options?: RequestInit) => {
  try {
    // Kiểm tra URL cơ sở API đã được định nghĩa chưa
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      console.error('API base URL chưa được định nghĩa trong biến môi trường');
      throw new Error('Lỗi cấu hình API');
    }

    // Đảm bảo URL được định dạng đúng
    const formattedUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;

    // Chuẩn bị CSRF token nếu có
    const csrfToken = getCsrfToken();

    // Tạo object headers từ options hoặc object rỗng nếu không có
    const headersObj = options?.headers || {};

    // Tạo Headers mới để sử dụng interface tiêu chuẩn
    const headers = new Headers(headersObj as HeadersInit);

    // Đặt header Content-Type mặc định nếu chưa được đặt
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Chỉ thêm CSRF token cho các phương thức không phải GET
    const method = options?.method?.toUpperCase() || 'GET';
    if (method !== 'GET' && csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    // Thiết lập timeout để tránh request bị treo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây timeout

    const response = await fetch(formattedUrl, {
      ...options,
      headers,
      credentials: 'include', // Giữ cookie (tương đương với `withCredentials: true` trong axios)
      signal: controller.signal,
    });

    // Xóa timeout
    clearTimeout(timeoutId);

    // Xử lý lỗi HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        ...errorData,
      };
    }

    // Phân tích response
    return response.json();
  } catch (error: any) {
    // Xử lý các loại lỗi khác nhau
    if (error.name === 'AbortError') {
      console.error('Request đã hết thời gian');
      throw new Error('Request đã hết thời gian');
    } else if (error.message === 'Failed to fetch' || error instanceof TypeError) {
      console.error('Lỗi mạng - Failed to fetch');

      // Kiểm tra nếu có lỗi CORS
      if (
        error.message &&
        (error.message.includes('CORS') || error.message.includes('cross-origin'))
      ) {
        console.error('Lỗi CORS - Có thể backend chưa được cấu hình đúng');
        throw new Error(
          'Lỗi CORS: Backend không chấp nhận request từ frontend. Vui lòng kiểm tra cấu hình CORS trên server.',
        );
      }

      throw new Error('Lỗi kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.');
    } else {
      console.error('Lỗi fetch:', error);
      throw error;
    }
  }
};

/**
 * Phương pháp tạm thời để giải quyết vấn đề CORS
 * Chỉ sử dụng trong môi trường phát triển
 */
export const fetchWithoutCsrf = async (url: string, options?: RequestInit) => {
  try {
    // Kiểm tra URL cơ sở API đã được định nghĩa chưa
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      console.error('API base URL chưa được định nghĩa trong biến môi trường');
      throw new Error('Lỗi cấu hình API');
    }

    // Đảm bảo URL được định dạng đúng
    const formattedUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;

    // Tạo object headers từ options hoặc object rỗng nếu không có
    const headersObj = options?.headers || {};

    // Tạo Headers mới để sử dụng interface tiêu chuẩn
    const headers = new Headers(headersObj as HeadersInit);

    // Đặt header Content-Type mặc định nếu chưa được đặt
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Thiết lập timeout để tránh request bị treo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây timeout

    const response = await fetch(formattedUrl, {
      ...options,
      headers,
      credentials: 'include', // Giữ cookie (tương đương với `withCredentials: true` trong axios)
      signal: controller.signal,
    });

    // Xóa timeout
    clearTimeout(timeoutId);

    // Xử lý lỗi HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        ...errorData,
      };
    }

    // Phân tích response
    return response.json();
  } catch (error: any) {
    // Xử lý lỗi tương tự fetcher
    if (error.name === 'AbortError') {
      console.error('Request đã hết thời gian');
      throw new Error('Request đã hết thời gian');
    } else if (error.message === 'Failed to fetch' || error instanceof TypeError) {
      console.error('Lỗi mạng - Failed to fetch');
      throw new Error('Lỗi kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.');
    } else {
      console.error('Lỗi fetch:', error);
      throw error;
    }
  }
};

/**
 * Hàm gọi API với xác thực và tự động refresh token
 */
export const fetchWithAuth = async (url: string, options?: RequestInit) => {
  // try {
  //   // Trong môi trường phát triển, có thể tạm thời sử dụng fetchWithoutCsrf để test
  //   if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_CSRF === 'true') {
  //     return await fetchWithoutCsrf(url, {
  //       ...options,
  //       credentials: 'include',
  //     });
  //   }

  //   return await fetcher(url, {
  //     ...options,
  //     credentials: 'include',
  //   });
  // } catch (error: any) {
  //   // Kiểm tra lỗi 401 Unauthorized
  //   if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
  //     const errorData = await error.json();
  //     try {
  //       console.log('Token hết hạn, đang thử refresh...');
  //       await fetcher('/auth/refresh', { method: 'GET' }); // Gọi refresh token
  //       return await fetcher(url, options); // Gọi lại request gốc
  //     } catch (refreshError) {
  //       console.error('Refresh token thất bại:', refreshError);
  //       // Chuyển hướng về trang đăng nhập
  //       // window.location.href = '/login';
  //       throw refreshError;
  //     }

  //     throw new Error(errorData.message || 'Unknown error');
  //   }

  //   throw error; // Ném lại lỗi nếu không phải lỗi 401
  // }

  try {
    // Trong môi trường phát triển, có thể tạm thời sử dụng fetchWithoutCsrf để test
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_CSRF === 'true') {
      return await fetchWithoutCsrf(url, {
        ...options,
        credentials: 'include',
      });
    }
    return await fetcher(url, {
      ...options,
      credentials: 'include',
    });
  } catch (error) {
    if (error instanceof Response) {
      // Parse JSON để lấy errorCode
      const errorData = await error.json();
      if (error instanceof Error && 'status' in error && error.status === 401) {
        try {
          await fetcher('/auth/refresh', {method: 'POST'}); // Gọi refresh token
          return await fetcher(url, options); // Gọi lại request gốc
        } catch (refreshError) {
          window.location.href = '/'; // Redirect về login nếu refresh token thất bại
          throw refreshError;
        }
      }
      throw new Error(errorData.message || 'Unknown error');
    }

    throw error; // Ném lại lỗi nếu không phải lỗi từ Response
  }
};

/**
 * Lấy CSRF token từ cookie hoặc meta tag
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  // Thử lấy từ meta tag trước
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag && metaTag.getAttribute('content')) {
    return metaTag.getAttribute('content');
  }

  // Thử lấy từ cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return value;
    }
  }

  return null;
}

// Các hàm tiện ích cho các phương thức HTTP phổ biến
export const get = (url: string, options?: RequestInit) =>
  fetchWithAuth(url, {...options, method: 'GET'});

export const post = (url: string, data: any, options?: RequestInit) =>
  fetchWithAuth(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });

export const put = (url: string, data: any, options?: RequestInit) =>
  fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const del = (url: string, options?: RequestInit) =>
  fetchWithAuth(url, {...options, method: 'DELETE'});

export default fetcher;

// export const fetcher = async (
//     url: string,
//     options?: RequestInit
//   ) => {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
//       {
//         ...options,
//         credentials: 'include', // Giữ cookie (tương đương với `withCredentials: true` trong axios)
//         headers: {
//           'Content-Type': 'application/json',
//           ...options?.headers,
//         },
//       }
//     );

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw { status: response.status, ...errorData };
//     }

//     return response.json();
//   };

// export const fetchWithAuth = async (url: string, options?: RequestInit) => {
//     try {
//       return await fetcher(url, {
//         ...options,
//         credentials: 'include',
//       });
//     } catch (error) {
//       if (error instanceof Response) {
//         // Parse JSON để lấy errorCode
//         const errorData = await error.json();
//         if (error instanceof Error && 'status' in error && error.status === 401) {
//           try {
//             await fetcher('/auth/refresh', { method: 'GET' }); // Gọi refresh token
//             return await fetcher(url, options); // Gọi lại request gốc
//           } catch (refreshError) {
//             window.location.href = '/'; // Redirect về login nếu refresh token thất bại
//             throw refreshError;
//           }
//         }
//         throw new Error(errorData.message || 'Unknown error');
//       }

//       throw error; // Ném lại lỗi nếu không phải lỗi từ Response
//     }
//   };
