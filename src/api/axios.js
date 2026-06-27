import axios from "axios";
import { showToast } from "../utils/toastBus";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (!error.response || error.response.status >= 500) {
      showToast("❌ Something went wrong / Что-то пошло не так", "error");
    }
    return Promise.reject(error);
  }
);

export default api;
