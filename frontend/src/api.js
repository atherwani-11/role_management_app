import axios from "axios";

const isAndroid = /Android/i.test(navigator.userAgent);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://role-management-app.onrender.com" || (isAndroid ? "http://10.0.2.2:8081" : "http://localhost:8081");

const API = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Log
API.interceptors.request.use(
  (config) => {
    console.log(
      "API Request:",
      config.method?.toUpperCase(),
      config.baseURL + config.url
    );
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Log
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(
      "API Error:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default API;