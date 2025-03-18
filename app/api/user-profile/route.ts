import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cookies } = req;
  
  try {
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`, {
      headers: {
        Cookie: cookies.accessToken ? `accessToken=${cookies.accessToken}` : '',
      },
      credentials: 'include',
    });
    
    const data = await apiResponse.json();
    
    // Lọc thêm dữ liệu nếu cần
    if (data.data) {
      // Đảm bảo không có thông tin nhạy cảm
      const { someOtherSensitiveField, ...safeData } = data.data;
      res.status(200).json({ ...data, data: safeData });
      return;
    }
    
    res.status(apiResponse.status).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}