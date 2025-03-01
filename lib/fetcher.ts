export const fetcher = async (
    url: string,
    options?: RequestInit
  ) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
      {
        ...options,
        credentials: 'include', // Giữ cookie (tương đương với `withCredentials: true` trong axios)
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      }
    );
  
   console.log('response', response);
  
    if (!response.ok) {
      const errorData = await response.json();
      throw { status: response.status, ...errorData };
    }
  
    return response.json();
  };
  
export const fetchWithAuth = async (url: string, options?: RequestInit) => {
    try {
      return await fetcher(url, options);
    } catch (error) {
      if (error instanceof Response) {
        // Parse JSON để lấy errorCode
        const errorData = await error.json();
        if (error.status === 401 && errorData.errorCode === 'AUTH_TOKEN_NOT_FOUND') {
          try {
            await fetcher('/auth/refresh', { method: 'GET' }); // Gọi refresh token
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
  
  