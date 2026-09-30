import axios from 'axios';
import { safeRedirect } from '@/lib/safe-redirect';

// Client cho API nghiệp vụ gọi từ trình duyệt. withCredentials → gửi cookie session
// Better Auth (BE bật CORS credentials). Không dùng cho /api/auth/* — đã có authClient.
export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  withCredentials: true,
});

api.interceptors.response.use(undefined, (err) => {
  if (axios.isAxiosError(err) && err.response?.status === 401 && typeof window !== 'undefined') {
    // Đang ở /login thì không redirect nữa, tránh vòng lặp reload.
    if (window.location.pathname.startsWith('/login')) return Promise.reject(err);
    const back = safeRedirect(window.location.pathname + window.location.search);
    const url = new URL('/login', window.location.origin);
    url.searchParams.set('redirect', back);
    window.location.assign(url);
  }
  return Promise.reject(err);
});
