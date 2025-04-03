import { createApp } from "vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import App from "@/App.vue";
import { createPinia } from "pinia";
import "@/styles";
import router from "@/router";
import { home, registryModule, security } from "@/modules";
import { httpPlugin } from "@/http";
import "element-plus/dist/index.css";
import axiosHttp from "@/http/http";

const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

registryModule(home, { router });
registryModule(security, { router });

app.use(router)
  .use(httpPlugin, axiosHttp)
  .use(createPinia())
  .mount("#app");
