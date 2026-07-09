import axios from "axios";
import { getToken } from "./auth";

// Buat instance axios khusus yang otomatis mengarah ke port 5000
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // 👈 Otomatis mengirim cookie (untuk refresh token)
});

// Interceptor: Otomatis menyuntikkan Access Token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;