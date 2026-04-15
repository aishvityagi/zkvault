import axios from "axios";

const api = axios.create({
  baseURL: "https://zkvault-backend.onrender.com",
  withCredentials: true,
});

export default api;