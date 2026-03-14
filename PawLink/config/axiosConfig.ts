import axios from "axios";
import { API_BASE_URL } from "./env";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 403) {
      const data = error.response.data;
      if (
        data.error === "account_suspended" ||
        data.error === "account_banned"
      ) {
        // Navigate to banned screen with params
        router.replace({
          pathname: "/banned",
          params: {
            reason: data.reason,
            end_date: data.end_date,
            error: data.error,
            support_email: data.support_email,
          },
        });
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
