import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

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
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    console.error("[Axios Request Error]:", error.message);
    return Promise.reject(error);
  },
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    console.error(
      `[Axios Response Error]${status ? ` (${status})` : ""}:`,
      serverMessage || error.message,
    );
    return Promise.reject(error);
  },
);

export default axiosClient;
