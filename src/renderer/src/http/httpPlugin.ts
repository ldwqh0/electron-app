import type { App, Plugin } from "vue";
import { AxiosInstance } from "axios";

export default {
  install (app: App, instance: AxiosInstance): void {
    app.provide("http", instance);
  }
} satisfies Plugin<AxiosInstance>;
