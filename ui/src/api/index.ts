import axios from "axios";
import { getFederationToken } from "../federation/token";

axios.interceptors.request.use((config) => {
  const token = getFederationToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["X-Federation-Token"] = token;
  }
  return config;
});

export default axios;
