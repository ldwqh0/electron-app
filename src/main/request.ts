import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

const instance = axios.create({});

export default function request (config: AxiosRequestConfig): Promise<AxiosResponse> {
  return instance.request(config);
}
