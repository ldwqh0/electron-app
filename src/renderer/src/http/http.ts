import axios from "axios";
import router from "@/router";

const http = axios.create({
  baseURL: env.AJAX_ROOT
});

http.interceptors.request.use(config => {
  config.headers["x-auth-token"] = sessionStorage.getItem("token-m");
  return config;
});

http.interceptors.response.use(res => {
  return res;
}, err => {
  if (err.response?.status === 401) {
    const redirect = window.location.href;
    router?.replace({
      name: "login",
      query: { redirect }
    });
  }
  throw err;
});

export default http;
