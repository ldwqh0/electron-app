import type { AxiosRequestConfig, AxiosResponse } from "axios";

let requestIndex = 0;

const requests: {
  [key: string]: {
    resolve: (v: PromiseLike<any>) => void,
    reject: (error: any) => void,
    request: AxiosRequestConfig
  };
} = {};

export default function <T = any, R = AxiosResponse<T>, D = any> (options: AxiosRequestConfig<D>): Promise<R> {
  return new Promise((resolve, reject) => {
    const key = `${requestIndex++}`;
    requests[key] = {
      resolve,
      reject,
      request: options
    };
    window.api.request(key, options);
  });
}

window.api.onResponse((key: string, v: any) => {
  const request = requests[key];
  console.debug(`response from request [${key}]`, request.request, v);
  delete requests[key];
  request.resolve({
    ...v,
    request: request.request
  });
}, (key: string, err: any) => {
  console.error(err);
  const request = requests[key];
  delete requests[key];
  request.reject({
    ...err, request: request.request
  });
});
