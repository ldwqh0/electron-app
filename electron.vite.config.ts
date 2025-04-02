import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import VuePlugin from "@vitejs/plugin-vue";
import eslintPlugin from "vite-plugin-eslint";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import env from "./config/env";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@": resolve(__dirname, "src/renderer/src")
      }
    },
    define: {
      env: Object.entries(env).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {})
    },
    plugins: [
      VuePlugin(),
      AutoImport({
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      }),
      eslintPlugin({
        include: ["src/**/*.js", "src/**/*.vue", "src/*.js", "src/*.vue"]
      })]
  }
});
