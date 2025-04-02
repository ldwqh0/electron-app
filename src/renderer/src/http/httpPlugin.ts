import type { App, Plugin } from "vue";
import type { HttpInstance } from "./http";

export default {
  install (app: App, instance: HttpInstance): void {
    app.provide("http", instance);
  }
} satisfies Plugin<HttpInstance>;
