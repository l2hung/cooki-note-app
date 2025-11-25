// apiClient.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.0.100:8080/api/v1"; //đổi thành địa chỉ backend và ip máy đang chạy

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: gắn token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("jwt_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: logout nếu 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("jwt_token");
      await AsyncStorage.removeItem("user_id");
      console.warn("Token hết hạn, vui lòng đăng nhập lại");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
