import axios from "axios";

const API = axios.create({
  baseURL: "https://role-management-app.onrender.com",
  timeout: 30000,   
});

export default API;