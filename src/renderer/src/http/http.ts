import type { AxiosRequestConfig, AxiosResponse } from "axios";
import electronRequest from "./electronRequest";
import router from "@/router";

class HttpInstance {
  private readonly baseUrl: string;

  constructor (baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  static create (baseUrl: string): HttpInstance {
    return new HttpInstance(baseUrl);
  }

  request<T = any, R = AxiosResponse<T>, D = any> (options: AxiosRequestConfig<D>): Promise<R> {
    const token = sessionStorage.getItem("token-m");
    return electronRequest({
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        "x-auth-token": token
      },
      url: `${this.baseUrl}${options.url}`
    });
  }

  async get<T = any, R = AxiosResponse<T>, D = any> (url: string, options?: AxiosRequestConfig<D>): Promise<R> {
    try {
      return await this.request({
        ...(options ?? {}),
        url: url,
        method: "get"
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        await router.replace({
          name: "login"
        });
      }
      throw error;
    }
  }

  post<T = any, R = AxiosResponse<T>, D = any> (url: string, data?: D, options?: AxiosRequestConfig<D>): Promise<R> {
    return this.request({
      ...(options ?? {}),
      url: url,
      method: "post",
      data: data
    });
  }

  put<T = any, R = AxiosResponse<T>, D = any> (url: string, data?: D, options?: AxiosRequestConfig<D>): Promise<R> {
    return this.request({
      ...(options ?? {}),
      url: url,
      method: "put",
      data
    });
  }

  patch<T = any, R = AxiosResponse<T>, D = any> (url: string, data?: D, options?: AxiosRequestConfig<D>): Promise<R> {
    return this.request({
      ...(options ?? {}),
      url: url,
      method: "patch",
      data
    });
  }

}

export default new HttpInstance();
export { HttpInstance };
