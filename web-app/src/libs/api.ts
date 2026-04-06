import axios from "axios";
import useContext from "./context";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const { accessToken } = useContext.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken, updateTokens, logout } = useContext.getState();

        if (refreshToken) {
          const refreshResponse = await axios.put(
            `${import.meta.env.VITE_API_URL}/auth`,
            {
              refreshToken,
            },
          );

          if (refreshResponse.data.accessToken) {
            updateTokens(refreshResponse.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            return api(originalRequest);
          }
        }

        // If refresh fails, logout
        logout();
      } catch (refreshError) {
        useContext.getState().logout();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
