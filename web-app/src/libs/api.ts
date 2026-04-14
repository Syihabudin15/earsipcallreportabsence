import axios from "axios";
import useContext from "./context";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const { token } = useContext.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
