import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearAuthSession,
  getAccessToken,
  setAccessToken,
} from "./tokenManager";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

function resolveBaseUrl(rawUrl: string | undefined): string {
  const trimmed = rawUrl?.trim().replace(/\/+$/, "");
  if (!trimmed) return "/api";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const baseURL: string = resolveBaseUrl(
  import.meta.env.VITE_API_URL as string | undefined,
);

export const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true, // Send & receive HttpOnly Refresh Token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

function isAuthBypassEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/otp") ||
    url.includes("/auth/google") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

// Request Interceptor: Attach in-memory Access Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error("[Axios Request Error]:", error.message);
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle 401 with Silent Refresh Queue
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string; code?: string }>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthBypassEndpoint(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axiosClient.post<{
          success: boolean;
          accessToken: string;
        }>("/auth/refresh");

        const newAccessToken = refreshResponse.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return await axiosClient(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);
        clearAuthSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const serverMessage = error.response?.data?.message;
    if (status !== 401 || !originalRequest?.url?.includes("/auth/refresh")) {
      console.error(
        `[Axios Response Error]${status ? ` (${status})` : ""}:`,
        serverMessage || error.message,
      );
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
