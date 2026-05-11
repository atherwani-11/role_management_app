import axios from "axios";

const isAndroid = /Android/i.test(navigator.userAgent);

const API = axios.create({
  baseURL: isAndroid
    ? "http://10.0.2.2:8081"
    : "http://localhost:8081",

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