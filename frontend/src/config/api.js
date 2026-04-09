import axios from "axios";

const api = axios.create({
  baseURL:         process.env.REACT_APP_API_URL || "http://localhost:5000",
  withCredentials: true, // send httpOnly cookies on every request
});

export default api;
