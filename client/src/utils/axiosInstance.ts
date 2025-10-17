import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:1739", 
});

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;